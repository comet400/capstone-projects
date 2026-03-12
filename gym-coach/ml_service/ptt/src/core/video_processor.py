"""
Video processing for exercise analysis
"""
import cv2
from typing import Optional, Callable
from ..detectors.base_detector import BaseDetector
from ..counters.base_counter import BaseCounter
from ..analyzers.form_checker import FormChecker
from ..utils.models import ExerciseAnalysis, ExerciseType, FormMetrics
from ..utils.skeleton_drawer import annotate_frame_to_base64
from ...config.thresholds import COMMON_ISSUE_THRESHOLD


class VideoProcessor:
    """Processes exercise videos frame by frame"""
    
    def __init__(self, detector: BaseDetector, analyzer: FormChecker, counter: BaseCounter):
        self.detector = detector
        self.analyzer = analyzer
        self.counter = counter
    
    def process_video(self, 
                     video_path: str, 
                     exercise_type: ExerciseType,
                     progress_callback: Optional[Callable[[int, int, int], None]] = None) -> ExerciseAnalysis:
        """
        Process a complete video
        
        Args:
            video_path: Path to video file
            exercise_type: Type of exercise
            progress_callback: Optional callback(frame_num, total_frames, rep_count)
            
        Returns:
            ExerciseAnalysis with complete results
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        frame_num = 0
        
        # Track the frame with the most issues for skeleton annotation
        worst_frame_num = -1
        worst_issue_count = -1
        worst_metrics = None
        worst_keypoints = None
        
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
                
                # Track worst-form frame (most issues)
                issue_count = len(metrics.issues)
                if issue_count > worst_issue_count:
                    worst_issue_count = issue_count
                    worst_frame_num = frame_num
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
        
        # Generate annotated skeleton frame
        annotated_frame_b64 = None
        if worst_frame_num > 0 and worst_keypoints is not None:
            try:
                # Re-read the worst frame from the video
                cap2 = cv2.VideoCapture(video_path)
                cap2.set(cv2.CAP_PROP_POS_FRAMES, worst_frame_num - 1)
                ret, worst_frame = cap2.read()
                cap2.release()
                
                if ret and worst_frame is not None:
                    # Use overall issues if worst_metrics has no issues
                    # (fallback for better coloring)
                    display_metrics = worst_metrics
                    if display_metrics and not display_metrics.issues and overall_issues:
                        display_metrics = FormMetrics()
                        display_metrics.issues = overall_issues
                    
                    annotated_frame_b64 = annotate_frame_to_base64(
                        worst_frame, worst_keypoints, display_metrics
                    )
            except Exception as e:
                print(f"[VideoProcessor] Failed to generate annotated frame: {e}")
        
        return ExerciseAnalysis(
            exercise_type=exercise_type,
            total_reps=self.counter.get_rep_count(),
            average_quality=avg_quality,
            rep_data=reps_data,
            overall_issues=overall_issues,
            video_fps=fps,
            total_frames=total_frames,
            annotated_frame=annotated_frame_b64,
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