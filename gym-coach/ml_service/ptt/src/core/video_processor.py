"""
Video processing for exercise analysis
"""
import cv2
import os
from collections import deque
from typing import Optional, Callable, List, Tuple, Deque
import numpy as np
from ..detectors.base_detector import BaseDetector
from ..counters.base_counter import BaseCounter
from ..analyzers.form_checker import FormChecker
from ..utils.models import ExerciseAnalysis, ExerciseType, FormMetrics
from ..utils.skeleton_drawer import annotate_frame_to_base64, create_skeleton_gif
from ...config.thresholds import COMMON_ISSUE_THRESHOLD

# Reliability/speed knobs. Defaults prioritize rep detection reliability while
# keeping non-analysis visuals small. Set ML_PROCESS_FPS=0 to analyze every frame.
_PROCESS_FPS = float(os.getenv("ML_PROCESS_FPS", "60"))
_DETECT_WIDTH = int(os.getenv("ML_DETECT_WIDTH", "640"))
_SNAPSHOT_WIDTH = int(os.getenv("ML_SNAPSHOT_WIDTH", "512"))
_CACHE_WIDTH = int(os.getenv("ML_GIF_CACHE_WIDTH", "360"))
# Real GIF generation is opt-in because even optimized frame caching/encoding
# slows the analysis response. The app can show a lightweight replay preview
# from the annotated snapshot without blocking the ML path.
_INCLUDE_GIF = os.getenv("ML_REAL_GIF", "0").lower() in {"1", "true", "yes", "on"}
_GIF_MAX_REP_FRAMES = int(os.getenv("ML_GIF_MAX_REP_FRAMES", "90"))
_GIF_PRE_SECONDS = float(os.getenv("ML_GIF_PRE_SECONDS", "1.0"))
_GIF_WIDTH = int(os.getenv("ML_GIF_WIDTH", "320"))
_GIF_FPS = int(os.getenv("ML_GIF_FPS", "8"))


class VideoProcessor:
    """Processes exercise videos frame by frame"""
    
    def __init__(self, detector: BaseDetector, analyzer: FormChecker, counter: BaseCounter):
        self.detector = detector
        self.analyzer = analyzer
        self.counter = counter
    
    @staticmethod
    def _downscale(frame: np.ndarray, target_w: int = _CACHE_WIDTH) -> np.ndarray:
        """Downscale a frame to target width, preserving aspect ratio."""
        h, w = frame.shape[:2]
        if w <= target_w:
            return frame.copy()
        scale = target_w / w
        return cv2.resize(frame, (target_w, int(h * scale)), interpolation=cv2.INTER_AREA)

    @staticmethod
    def _scale_keypoints(keypoints: np.ndarray, scale_x: float, scale_y: float) -> np.ndarray:
        scaled = keypoints.copy()
        scaled[:, 0] *= scale_x
        scaled[:, 1] *= scale_y
        return scaled

    @staticmethod
    def _sync_counter_fps(counter: BaseCounter, fps: float) -> None:
        """Keep rep timing/grading aligned with the actual video FPS."""
        if not fps or fps <= 0:
            return

        counter.fps = fps
        if hasattr(counter, "grader"):
            counter.grader.fps = fps
        if hasattr(counter, "min_rep_frames"):
            counter.min_rep_frames = max(1, int(round(fps * 0.2)))
        if hasattr(counter, "max_rep_frames"):
            counter.max_rep_frames = int(round(fps * 15))
    
    def process_video(self, 
                     video_path: str, 
                     exercise_type: ExerciseType,
                     progress_callback: Optional[Callable[[int, int, int], None]] = None,
                     include_gif: Optional[bool] = None) -> ExerciseAnalysis:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self._sync_counter_fps(self.counter, fps)
        sample_interval = 1
        if fps and fps > 0 and _PROCESS_FPS > 0:
            sample_interval = max(1, int(round(fps / _PROCESS_FPS)))
        
        frame_num = 0
        include_gif_enabled = _INCLUDE_GIF if include_gif is None else include_gif
        
        # GIF is a visual replay only and stays off by default for speed.
        prebuffer_len = max(1, int(round(_PROCESS_FPS * _GIF_PRE_SECONDS))) if include_gif_enabled else 0
        gif_prebuffer: Optional[Deque[Tuple[np.ndarray, np.ndarray, FormMetrics]]] = (
            deque(maxlen=prebuffer_len) if include_gif_enabled else None
        )
        gif_trace_frames: Optional[List[Tuple[np.ndarray, np.ndarray, FormMetrics]]] = None
        gif_capture_done = False
        
        # Track worst frame for static snapshot (full-res kept for just one frame)
        worst_frame_num = -1
        worst_issue_count = -1
        worst_frame_img: Optional[np.ndarray] = None
        worst_metrics: Optional[FormMetrics] = None
        worst_keypoints: Optional[np.ndarray] = None
        worst_frame_in_rep = False
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_num += 1

            if (frame_num - 1) % sample_interval != 0:
                if progress_callback and frame_num % 30 == 0:
                    progress_callback(frame_num, total_frames, self.counter.get_rep_count())
                continue
            
            h, w = frame.shape[:2]
            detect_frame = self._downscale(frame, _DETECT_WIDTH)
            dh, dw = detect_frame.shape[:2]

            # Detect pose on a smaller frame, then map keypoints back so the
            # exercise analyzers still work in original video coordinates.
            keypoints = self.detector.detect(detect_frame)
            if keypoints is not None and (dw != w or dh != h):
                keypoints = self._scale_keypoints(keypoints, w / dw, h / dh)
            
            if keypoints is not None:
                # Analyze form
                metrics = self.analyzer.analyze(keypoints)
                
                if include_gif_enabled:
                    small = self._downscale(frame)
                    sh, sw = small.shape[:2]
                    scaled_kp = self._scale_keypoints(keypoints, sw / w, sh / h)
                    trace_frame = (small, scaled_kp, metrics)

                # Count reps
                rep_completed = self.counter.process_frame(frame_num, metrics)

                if include_gif_enabled and not gif_capture_done:
                    if self.counter.current_rep_start is not None and gif_trace_frames is None:
                        gif_trace_frames = list(gif_prebuffer or [])

                    if gif_trace_frames is not None:
                        gif_trace_frames.append(trace_frame)
                        if len(gif_trace_frames) >= _GIF_MAX_REP_FRAMES:
                            gif_capture_done = True
                    else:
                        if gif_prebuffer is not None:
                            gif_prebuffer.append(trace_frame)

                    if rep_completed:
                        gif_capture_done = True
                
                # Track a single presentation snapshot. Prefer frames inside a
                # detected rep, but keep a fallback from any valid pose.
                issue_count = len(metrics.issues)
                in_rep = self.counter.current_rep_start is not None
                current_score = issue_count + (1000 if in_rep else 0)
                best_score = worst_issue_count + (1000 if worst_frame_in_rep else 0)
                if worst_frame_img is None or current_score > best_score:
                    worst_issue_count = issue_count
                    worst_frame_num = frame_num
                    worst_frame_in_rep = in_rep
                    worst_frame_img = self._downscale(frame, _SNAPSHOT_WIDTH)
                    worst_metrics = metrics
                    wh, ww = worst_frame_img.shape[:2]
                    worst_keypoints = self._scale_keypoints(keypoints, ww / w, wh / h)
            
            # Progress callback
            if progress_callback and frame_num % 30 == 0:
                progress_callback(frame_num, total_frames, self.counter.get_rep_count())
        
        cap.release()
        
        # Compile results
        reps_data = self.counter.get_reps_data()
        overall_issues = self._compile_overall_issues(reps_data)
        
        avg_quality = 0.0
        if reps_data:
            avg_quality = sum(rep.quality_score for rep in reps_data) / len(reps_data)
        
        # Generate annotated skeleton frame (static snapshot) — uses stored full-res frame
        annotated_frame_b64 = None
        if worst_frame_img is not None and worst_keypoints is not None:
            try:
                display_metrics = worst_metrics
                if display_metrics and not display_metrics.issues and overall_issues:
                    display_metrics = FormMetrics()
                    display_metrics.issues = overall_issues
                
                annotated_frame_b64 = annotate_frame_to_base64(
                    worst_frame_img, worst_keypoints, display_metrics
                )
            except Exception as e:
                print(f"[VideoProcessor] Failed to generate annotated frame: {e}")
        
        # Free the full-res frame
        worst_frame_img = None
        
        # Generate animated skeleton GIF from the first detected rep replay.
        annotated_gif_b64 = None
        if include_gif_enabled and reps_data and gif_trace_frames:
            try:
                first_rep = reps_data[0]
                
                # Use overall issues for consistent coloring
                gif_metrics = FormMetrics()
                gif_metrics.issues = overall_issues if overall_issues else (
                    first_rep.issues if first_rep.issues else []
                )
                
                # Build GIF data directly from cached frames — no re-read!
                gif_frame_data = [
                    (small_frame, kp, gif_metrics)
                    for small_frame, kp, _ in gif_trace_frames
                ]
                
                if gif_frame_data:
                    annotated_gif_b64 = create_skeleton_gif(
                        gif_frame_data,
                        target_width=_GIF_WIDTH,
                        target_fps=_GIF_FPS,
                        source_fps=_PROCESS_FPS,
                    )
            except Exception as e:
                print(f"[VideoProcessor] Failed to generate skeleton GIF: {e}")

        # Free cached frames
        if gif_prebuffer is not None:
            gif_prebuffer.clear()
        if gif_trace_frames:
            gif_trace_frames.clear()
        
        return ExerciseAnalysis(
            exercise_type=exercise_type,
            total_reps=self.counter.get_rep_count(),
            average_quality=avg_quality,
            rep_data=reps_data,
            overall_issues=overall_issues,
            video_fps=fps,
            total_frames=total_frames,
            annotated_frame=annotated_frame_b64,
            annotated_gif=annotated_gif_b64,
        )
    
    def _compile_overall_issues(self, reps_data: list) -> list:
        """Compile common issues across all reps"""
        if not reps_data:
            return []
        
        issue_count = {}
        for rep in reps_data:
            for issue in rep.issues:
                issue_count[issue] = issue_count.get(issue, 0) + 1
        
        threshold = len(reps_data) * COMMON_ISSUE_THRESHOLD
        common_issues = [
            issue for issue, count in issue_count.items()
            if count >= threshold
        ]
        
        return common_issues
