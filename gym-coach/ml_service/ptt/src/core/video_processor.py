"""
Video processing for exercise analysis
"""
import cv2
from typing import Optional, Callable
from ..detectors.base_detector import BaseDetector
from ..counters.base_counter import BaseCounter
from ..analyzers.form_checker import FormChecker
from ..utils.models import ExerciseAnalysis, ExerciseType, FormMetrics
from ...config.thresholds import COMMON_ISSUE_THRESHOLD


class VideoProcessor:
    """Processes exercise videos frame by frame"""
    
    def __init__(self, detector: BaseDetector, analyzer: FormChecker, counter: BaseCounter):
        """
        Initialize video processor
        
        Args:
            detector: Pose detector instance
            analyzer: Form analyzer instance
            counter: Rep counter instance
        """
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
        
        return ExerciseAnalysis(
            exercise_type=exercise_type,
            total_reps=self.counter.get_rep_count(),
            average_quality=avg_quality,
            rep_data=reps_data,
            overall_issues=overall_issues,
            video_fps=fps,
            total_frames=total_frames
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