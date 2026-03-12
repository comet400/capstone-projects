"""
Video processing for exercise analysis
"""
import cv2
from typing import Optional, Callable, List, Tuple, Dict
import numpy as np
from ..detectors.base_detector import BaseDetector
from ..counters.base_counter import BaseCounter
from ..analyzers.form_checker import FormChecker
from ..utils.models import ExerciseAnalysis, ExerciseType, FormMetrics
from ..utils.skeleton_drawer import annotate_frame_to_base64, create_skeleton_gif
from ...config.thresholds import COMMON_ISSUE_THRESHOLD

# Target width for cached frames (saves memory vs full-res)
_CACHE_WIDTH = 480


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
    
    def process_video(self, 
                     video_path: str, 
                     exercise_type: ExerciseType,
                     progress_callback: Optional[Callable[[int, int, int], None]] = None) -> ExerciseAnalysis:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        frame_num = 0
        
        # Store (frame_number, small_frame, keypoints, metrics) during the ONLY read pass
        frame_records: List[Tuple[int, np.ndarray, np.ndarray, FormMetrics]] = []
        
        # Track worst frame for static snapshot (full-res kept for just one frame)
        worst_frame_num = -1
        worst_issue_count = -1
        worst_frame_img: Optional[np.ndarray] = None
        worst_metrics: Optional[FormMetrics] = None
        worst_keypoints: Optional[np.ndarray] = None
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_num += 1
            
            # Detect pose
            keypoints = self.detector.detect(frame)
            
            if keypoints is not None:
                # Analyze form
                metrics = self.analyzer.analyze(keypoints)
                
                # Count reps
                self.counter.process_frame(frame_num, metrics)
                
                # Store downscaled frame + keypoints for GIF (no re-read later)
                small = self._downscale(frame)
                # Scale keypoints to match downscaled frame
                h, w = frame.shape[:2]
                sh, sw = small.shape[:2]
                scale_x = sw / w
                scale_y = sh / h
                scaled_kp = keypoints.copy()
                scaled_kp[:, 0] *= scale_x
                scaled_kp[:, 1] *= scale_y
                frame_records.append((frame_num, small, scaled_kp, metrics))
                
                # Track worst-form frame (most issues) — keep full-res for snapshot
                issue_count = len(metrics.issues)
                if issue_count > worst_issue_count:
                    worst_issue_count = issue_count
                    worst_frame_num = frame_num
                    worst_frame_img = frame.copy()
                    worst_metrics = metrics
                    worst_keypoints = keypoints.copy()
            
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
        
        # Generate animated skeleton GIF for the worst-scoring rep
        annotated_gif_b64 = None
        if reps_data and frame_records:
            try:
                worst_rep = min(reps_data, key=lambda r: r.quality_score)
                start = worst_rep.start_frame
                end = worst_rep.end_frame
                
                # Use overall issues for consistent coloring
                gif_metrics = FormMetrics()
                gif_metrics.issues = overall_issues if overall_issues else (
                    worst_rep.issues if worst_rep.issues else []
                )
                
                # Build GIF data directly from cached frames — no re-read!
                gif_frame_data = [
                    (small_frame, kp, gif_metrics)
                    for fnum, small_frame, kp, _ in frame_records
                    if start <= fnum <= end
                ]
                
                if gif_frame_data:
                    annotated_gif_b64 = create_skeleton_gif(
                        gif_frame_data,
                        target_width=320,
                        target_fps=10,
                        source_fps=fps,
                    )
            except Exception as e:
                print(f"[VideoProcessor] Failed to generate skeleton GIF: {e}")
        
        # Free cached frames
        frame_records.clear()
        
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