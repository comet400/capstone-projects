# this code is not optimized for performance nor modular, it is a single script for simplicity and testing purposes

"""
UCoach Video Analyzer
Analyzes pre-recorded workout videos for rep counting and form assessment.
Supports: Squats, Push-ups, Pull-ups
"""

import cv2
import numpy as np
import math
from ultralytics import YOLO
from dataclasses import dataclass
from typing import List, Tuple, Dict
from enum import Enum


class ExerciseType(Enum):
    SQUAT = "squat"
    PUSHUP = "pushup"
    PULLUP = "pullup"


# COCO-17 keypoint indices
class Keypoint:
    NOSE = 0
    L_EYE = 1
    R_EYE = 2
    L_EAR = 3
    R_EAR = 4
    L_SHOULDER = 5
    R_SHOULDER = 6
    L_ELBOW = 7
    R_ELBOW = 8
    L_WRIST = 9
    R_WRIST = 10
    L_HIP = 11
    R_HIP = 12
    L_KNEE = 13
    R_KNEE = 14
    L_ANKLE = 15
    R_ANKLE = 16


@dataclass
class RepData:
    """Data for a single repetition"""
    rep_number: int
    start_frame: int
    end_frame: int
    quality_score: float  # 0-100
    issues: List[str]
    metrics: Dict[str, float]


@dataclass
class ExerciseAnalysis:
    """Complete analysis of an exercise video"""
    exercise_type: ExerciseType
    total_reps: int
    average_quality: float
    rep_data: List[RepData]
    overall_issues: List[str]
    video_fps: float
    total_frames: int


class FormChecker:
    """Analyzes exercise form based on biomechanics"""
    
    @staticmethod
    def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
        """Calculate angle at point b formed by points a, b, c"""
        ba = a - b
        bc = c - b
        
        norm_ba = np.linalg.norm(ba)
        norm_bc = np.linalg.norm(bc)
        
        if norm_ba < 1e-6 or norm_bc < 1e-6:
            return float('nan')
        
        cos_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        
        return math.degrees(math.acos(cos_angle))
    
    @staticmethod
    def check_squat_form(keypoints: np.ndarray, conf_threshold: float = 0.5) -> Tuple[Dict, List[str]]:
        """
        Analyze squat form
        Returns: (metrics dict, issues list)
        """
        metrics = {}
        issues = []
        
        # Extract key points
        l_hip = keypoints[Keypoint.L_HIP]
        r_hip = keypoints[Keypoint.R_HIP]
        l_knee = keypoints[Keypoint.L_KNEE]
        r_knee = keypoints[Keypoint.R_KNEE]
        l_ankle = keypoints[Keypoint.L_ANKLE]
        r_ankle = keypoints[Keypoint.R_ANKLE]
        l_shoulder = keypoints[Keypoint.L_SHOULDER]
        r_shoulder = keypoints[Keypoint.R_SHOULDER]
        
        # Check if key points are visible
        required_points = [l_hip, r_hip, l_knee, r_knee, l_ankle, r_ankle]
        if not all(p[2] >= conf_threshold for p in required_points):
            issues.append("Body not fully visible")
            return metrics, issues
        
        # Calculate knee angles
        left_knee_angle = FormChecker.calculate_angle(
            l_hip[:2], l_knee[:2], l_ankle[:2]
        )
        right_knee_angle = FormChecker.calculate_angle(
            r_hip[:2], r_knee[:2], r_ankle[:2]
        )
        
        metrics['left_knee_angle'] = left_knee_angle
        metrics['right_knee_angle'] = right_knee_angle
        
        # Calculate hip height relative to knees (depth)
        hip_y = (l_hip[1] + r_hip[1]) / 2
        knee_y = (l_knee[1] + r_knee[1]) / 2
        shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        
        torso_length = abs(hip_y - shoulder_y)
        if torso_length > 1e-6:
            depth_ratio = (knee_y - hip_y) / torso_length
            metrics['depth_ratio'] = depth_ratio
            
            # Check depth (hips should go below knees at bottom)
            if depth_ratio < -0.3:  # Deep squat
                metrics['depth_category'] = 'deep'
            elif depth_ratio < -0.15:  # Parallel
                metrics['depth_category'] = 'parallel'
            else:
                metrics['depth_category'] = 'shallow'
                issues.append("Squat depth insufficient - go lower")
        
        # Check knee alignment (knees shouldn't cave in)
        knee_distance = abs(l_knee[0] - r_knee[0])
        hip_distance = abs(l_hip[0] - r_hip[0])
        
        if knee_distance > 0 and hip_distance > 0:
            knee_hip_ratio = knee_distance / hip_distance
            metrics['knee_alignment'] = knee_hip_ratio
            
            if knee_hip_ratio < 0.7:
                issues.append("Knees caving inward - push knees out")
        
        # Check back angle (torso shouldn't lean too far forward)
        if l_shoulder[2] >= conf_threshold and r_shoulder[2] >= conf_threshold:
            mid_shoulder = (l_shoulder[:2] + r_shoulder[:2]) / 2
            mid_hip = (l_hip[:2] + r_hip[:2]) / 2
            
            torso_angle = math.degrees(math.atan2(
                mid_hip[1] - mid_shoulder[1],
                mid_hip[0] - mid_shoulder[0]
            ))
            metrics['torso_angle'] = abs(torso_angle)
            
            if abs(torso_angle) > 30:
                issues.append("Leaning too far forward - keep chest up")
        
        return metrics, issues
    
    @staticmethod
    def check_pushup_form(keypoints: np.ndarray, conf_threshold: float = 0.5) -> Tuple[Dict, List[str]]:
        """
        Analyze push-up form
        Returns: (metrics dict, issues list)
        """
        metrics = {}
        issues = []
        
        # Extract key points
        l_shoulder = keypoints[Keypoint.L_SHOULDER]
        r_shoulder = keypoints[Keypoint.R_SHOULDER]
        l_elbow = keypoints[Keypoint.L_ELBOW]
        r_elbow = keypoints[Keypoint.R_ELBOW]
        l_wrist = keypoints[Keypoint.L_WRIST]
        r_wrist = keypoints[Keypoint.R_WRIST]
        l_hip = keypoints[Keypoint.L_HIP]
        r_hip = keypoints[Keypoint.R_HIP]
        
        # Check visibility
        required_points = [l_shoulder, r_shoulder, l_elbow, r_elbow, l_hip, r_hip]
        if not all(p[2] >= conf_threshold for p in required_points):
            issues.append("Body not fully visible")
            return metrics, issues
        
        # Calculate elbow angles
        left_elbow_angle = FormChecker.calculate_angle(
            l_shoulder[:2], l_elbow[:2], l_wrist[:2]
        )
        right_elbow_angle = FormChecker.calculate_angle(
            r_shoulder[:2], r_elbow[:2], r_wrist[:2]
        )
        
        metrics['left_elbow_angle'] = left_elbow_angle
        metrics['right_elbow_angle'] = right_elbow_angle
        
        avg_elbow_angle = (left_elbow_angle + right_elbow_angle) / 2
        metrics['avg_elbow_angle'] = avg_elbow_angle
        
        # Check body alignment (straight line from shoulders to hips)
        mid_shoulder = (l_shoulder[:2] + r_shoulder[:2]) / 2
        mid_hip = (l_hip[:2] + r_hip[:2]) / 2
        
        # Calculate body angle (should be straight)
        shoulder_hip_distance = np.linalg.norm(mid_shoulder - mid_hip)
        
        if shoulder_hip_distance > 1e-6:
            # Check if hips are sagging or piking
            vertical_diff = abs(mid_shoulder[1] - mid_hip[1])
            alignment_ratio = vertical_diff / shoulder_hip_distance
            metrics['body_alignment'] = alignment_ratio
            
            if alignment_ratio < 0.7:  # Body not straight enough
                if mid_hip[1] > mid_shoulder[1]:
                    issues.append("Hips sagging - engage core")
                else:
                    issues.append("Hips too high - lower them")
        
        # Check elbow flare (elbows shouldn't flare too much)
        if l_wrist[2] >= conf_threshold and r_wrist[2] >= conf_threshold:
            elbow_width = abs(l_elbow[0] - r_elbow[0])
            shoulder_width = abs(l_shoulder[0] - r_shoulder[0])
            
            if elbow_width > 0 and shoulder_width > 0:
                flare_ratio = elbow_width / shoulder_width
                metrics['elbow_flare'] = flare_ratio
                
                if flare_ratio > 1.3:
                    issues.append("Elbows flaring too wide - tuck them in")
        
        return metrics, issues
    
    @staticmethod
    def check_pullup_form(keypoints: np.ndarray, conf_threshold: float = 0.5) -> Tuple[Dict, List[str]]:
        """
        Analyze pull-up form
        Returns: (metrics dict, issues list)
        """
        metrics = {}
        issues = []
        
        # Extract key points
        nose = keypoints[Keypoint.NOSE]
        l_shoulder = keypoints[Keypoint.L_SHOULDER]
        r_shoulder = keypoints[Keypoint.R_SHOULDER]
        l_elbow = keypoints[Keypoint.L_ELBOW]
        r_elbow = keypoints[Keypoint.R_ELBOW]
        l_wrist = keypoints[Keypoint.L_WRIST]
        r_wrist = keypoints[Keypoint.R_WRIST]
        l_hip = keypoints[Keypoint.L_HIP]
        r_hip = keypoints[Keypoint.R_HIP]
        
        # Check visibility
        required_points = [l_shoulder, r_shoulder, l_elbow, r_elbow]
        if not all(p[2] >= conf_threshold for p in required_points):
            issues.append("Upper body not fully visible")
            return metrics, issues
        
        # Calculate elbow angles
        left_elbow_angle = FormChecker.calculate_angle(
            l_shoulder[:2], l_elbow[:2], l_wrist[:2]
        )
        right_elbow_angle = FormChecker.calculate_angle(
            r_shoulder[:2], r_elbow[:2], r_wrist[:2]
        )
        
        metrics['left_elbow_angle'] = left_elbow_angle
        metrics['right_elbow_angle'] = right_elbow_angle
        
        # Check chin clearance (nose should be above hands at top)
        mid_wrist_y = (l_wrist[1] + r_wrist[1]) / 2
        
        if nose[2] >= conf_threshold and l_wrist[2] >= conf_threshold and r_wrist[2] >= conf_threshold:
            clearance = mid_wrist_y - nose[1]
            metrics['chin_clearance'] = clearance
            
            if clearance < 0:
                metrics['full_rom'] = True
            else:
                metrics['full_rom'] = False
                issues.append("Pull higher - chin should clear the bar")
        
        # Check body swing
        if l_hip[2] >= conf_threshold and r_hip[2] >= conf_threshold:
            mid_shoulder = (l_shoulder[:2] + r_shoulder[:2]) / 2
            mid_hip = (l_hip[:2] + r_hip[:2]) / 2
            
            horizontal_offset = abs(mid_hip[0] - mid_shoulder[0])
            vertical_distance = abs(mid_hip[1] - mid_shoulder[1])
            
            if vertical_distance > 1e-6:
                swing_ratio = horizontal_offset / vertical_distance
                metrics['body_swing'] = swing_ratio
                
                if swing_ratio > 0.3:
                    issues.append("Excessive body swing - control the movement")
        
        return metrics, issues


class RepCounter:
    """Counts repetitions for different exercises"""
    
    def __init__(self, exercise_type: ExerciseType):
        self.exercise_type = exercise_type
        self.state = "up"  # or "down"
        self.rep_count = 0
        self.current_rep_start = None
        self.reps_data: List[RepData] = []
        self.frame_metrics: List[Tuple[int, Dict, List[str]]] = []
        
    def process_frame(self, frame_num: int, keypoints: np.ndarray) -> bool:
        """
        Process a frame and detect rep transitions
        Returns: True if a rep was just completed
        """
        metrics, issues = self._get_form_metrics(keypoints)
        self.frame_metrics.append((frame_num, metrics, issues))
        
        if self.exercise_type == ExerciseType.SQUAT:
            return self._process_squat(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PUSHUP:
            return self._process_pushup(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PULLUP:
            return self._process_pullup(frame_num, metrics)
        
        return False
    
    def _get_form_metrics(self, keypoints: np.ndarray) -> Tuple[Dict, List[str]]:
        """Get form metrics for current exercise type"""
        if self.exercise_type == ExerciseType.SQUAT:
            return FormChecker.check_squat_form(keypoints)
        elif self.exercise_type == ExerciseType.PUSHUP:
            return FormChecker.check_pushup_form(keypoints)
        elif self.exercise_type == ExerciseType.PULLUP:
            return FormChecker.check_pullup_form(keypoints)
        return {}, []
    
    def _process_squat(self, frame_num: int, metrics: Dict) -> bool:
        """Process squat rep detection"""
        if 'depth_ratio' not in metrics:
            return False
        
        depth = metrics['depth_ratio']
        rep_completed = False
        
        # Going down
        if self.state == "up" and depth < -0.15:  # Below parallel
            self.state = "down"
            self.current_rep_start = frame_num
        
        # Coming back up
        elif self.state == "down" and depth > -0.05:  # Back to standing
            self.state = "up"
            if self.current_rep_start is not None:
                rep_completed = True
                self._finalize_rep(frame_num)
        
        return rep_completed
    
    def _process_pushup(self, frame_num: int, metrics: Dict) -> bool:
        """Process push-up rep detection"""
        if 'avg_elbow_angle' not in metrics:
            return False
        
        elbow_angle = metrics['avg_elbow_angle']
        rep_completed = False
        
        # Going down
        if self.state == "up" and elbow_angle < 100:  # Elbows bent
            self.state = "down"
            self.current_rep_start = frame_num
        
        # Pushing back up
        elif self.state == "down" and elbow_angle > 160:  # Arms straight
            self.state = "up"
            if self.current_rep_start is not None:
                rep_completed = True
                self._finalize_rep(frame_num)
        
        return rep_completed
    
    def _process_pullup(self, frame_num: int, metrics: Dict) -> bool:
        """Process pull-up rep detection"""
        if 'left_elbow_angle' not in metrics or 'right_elbow_angle' not in metrics:
            return False
        
        avg_elbow = (metrics['left_elbow_angle'] + metrics['right_elbow_angle']) / 2
        rep_completed = False
        
        # Pulling up
        if self.state == "down" and avg_elbow < 90:  # Pulled up
            self.state = "up"
            self.current_rep_start = frame_num
        
        # Going back down
        elif self.state == "up" and avg_elbow > 160:  # Arms extended
            self.state = "down"
            if self.current_rep_start is not None:
                rep_completed = True
                self._finalize_rep(frame_num)
        
        return rep_completed
    
    def _finalize_rep(self, end_frame: int):
        """Finalize the current rep and calculate quality"""
        self.rep_count += 1
        
        # Get metrics from this rep's frames
        rep_frames = [
            (f, m, i) for f, m, i in self.frame_metrics
            if self.current_rep_start <= f <= end_frame
        ]
        
        # Calculate quality score
        quality_score, rep_issues = self._calculate_rep_quality(rep_frames)
        
        # Get average metrics for the rep
        avg_metrics = self._average_metrics(rep_frames)
        
        rep_data = RepData(
            rep_number=self.rep_count,
            start_frame=self.current_rep_start,
            end_frame=end_frame,
            quality_score=quality_score,
            issues=rep_issues,
            metrics=avg_metrics
        )
        
        self.reps_data.append(rep_data)
        self.current_rep_start = None
    
    def _calculate_rep_quality(self, rep_frames: List[Tuple[int, Dict, List[str]]]) -> Tuple[float, List[str]]:
        """Calculate quality score (0-100) for a rep"""
        if not rep_frames:
            return 0.0, ["Incomplete rep"]
        
        # Collect all unique issues
        all_issues = set()
        for _, _, issues in rep_frames:
            all_issues.update(issues)
        
        # Base score
        score = 100.0
        
        # Deduct points for issues
        issue_penalties = {
            "Body not fully visible": 30,
            "Squat depth insufficient": 20,
            "Knees caving inward": 15,
            "Leaning too far forward": 10,
            "Hips sagging": 15,
            "Hips too high": 15,
            "Elbows flaring too wide": 10,
            "Pull higher": 25,
            "Excessive body swing": 15,
        }
        
        rep_issues = []
        for issue in all_issues:
            for key, penalty in issue_penalties.items():
                if key in issue:
                    score -= penalty
                    rep_issues.append(issue)
                    break
        
        return max(0, score), list(set(rep_issues))
    
    def _average_metrics(self, rep_frames: List[Tuple[int, Dict, List[str]]]) -> Dict[str, float]:
        """Calculate average metrics across rep frames"""
        if not rep_frames:
            return {}
        
        # Collect all metric keys
        all_keys = set()
        for _, metrics, _ in rep_frames:
            all_keys.update(metrics.keys())
        
        # Average numeric metrics
        avg_metrics = {}
        for key in all_keys:
            values = [
                metrics[key] for _, metrics, _ in rep_frames
                if key in metrics and isinstance(metrics[key], (int, float)) and not math.isnan(metrics[key])
            ]
            if values:
                avg_metrics[key] = sum(values) / len(values)
        
        return avg_metrics


class VideoAnalyzer:
    """Main video analysis class"""
    
    def __init__(self, model_path: str = "yolov8n-pose.pt"):
        self.model = YOLO(model_path)
        self.conf_threshold = 0.25
        self.kp_threshold = 0.5
    
    def analyze_video(self, video_path: str, exercise_type: ExerciseType) -> ExerciseAnalysis:
        """
        Analyze a complete workout video
        Returns: ExerciseAnalysis object with complete results
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        rep_counter = RepCounter(exercise_type)
        frame_num = 0
        
        print(f"Analyzing {exercise_type.value} video...")
        print(f"Total frames: {total_frames}, FPS: {fps}")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_num += 1
            
            # Run pose detection
            results = self.model.predict(frame, conf=self.conf_threshold, verbose=False)[0]
            
            # Extract keypoints
            if results.keypoints and results.keypoints.xy is not None:
                xy = results.keypoints.xy.cpu().numpy()
                conf = results.keypoints.conf.cpu().numpy()
                
                if len(xy) > 0:
                    # Get best detection
                    best_idx = np.argmax(conf.mean(axis=1))
                    
                    # Build keypoint array (17 keypoints x 3: x, y, confidence)
                    keypoints = np.zeros((17, 3), dtype=np.float32)
                    keypoints[:, :2] = xy[best_idx]
                    keypoints[:, 2] = conf[best_idx]
                    
                    # Process frame for rep counting
                    rep_counter.process_frame(frame_num, keypoints)
            
            # Progress indicator
            if frame_num % 30 == 0:
                progress = (frame_num / total_frames) * 100
                print(f"Progress: {progress:.1f}% - Reps: {rep_counter.rep_count}")
        
        cap.release()
        
        # Compile overall issues
        overall_issues = self._compile_overall_issues(rep_counter.reps_data)
        
        # Calculate average quality
        if rep_counter.reps_data:
            avg_quality = sum(rep.quality_score for rep in rep_counter.reps_data) / len(rep_counter.reps_data)
        else:
            avg_quality = 0.0
        
        analysis = ExerciseAnalysis(
            exercise_type=exercise_type,
            total_reps=rep_counter.rep_count,
            average_quality=avg_quality,
            rep_data=rep_counter.reps_data,
            overall_issues=overall_issues,
            video_fps=fps,
            total_frames=total_frames
        )
        
        return analysis
    
    def _compile_overall_issues(self, reps_data: List[RepData]) -> List[str]:
        """Compile most common issues across all reps"""
        if not reps_data:
            return []
        
        # Count issue frequency
        issue_count = {}
        for rep in reps_data:
            for issue in rep.issues:
                issue_count[issue] = issue_count.get(issue, 0) + 1
        
        # Get issues that appear in > 30% of reps
        threshold = len(reps_data) * 0.3
        common_issues = [
            issue for issue, count in issue_count.items()
            if count >= threshold
        ]
        
        return common_issues


def format_analysis_report(analysis: ExerciseAnalysis) -> str:
    """Format analysis results as a readable report"""
    report = []
    report.append("=" * 60)
    report.append(f"UCoach Exercise Analysis Report")
    report.append("=" * 60)
    report.append(f"Exercise Type: {analysis.exercise_type.value.upper()}")
    report.append(f"Total Reps Detected: {analysis.total_reps}")
    report.append(f"Average Quality Score: {analysis.average_quality:.1f}/100")
    report.append("")
    
    # Overall feedback
    if analysis.average_quality >= 80:
        report.append("Overall Performance: EXCELLENT ⭐")
    elif analysis.average_quality >= 60:
        report.append("Overall Performance: GOOD 👍")
    else:
        report.append("Overall Performance: NEEDS IMPROVEMENT 🔔")
    
    report.append("")
    
    # Common issues
    if analysis.overall_issues:
        report.append("Common Issues Detected:")
        for issue in analysis.overall_issues:
            report.append(f"  • {issue}")
    else:
        report.append("No major issues detected! Great form!")
    
    report.append("")
    report.append("-" * 60)
    report.append("Rep-by-Rep Breakdown:")
    report.append("-" * 60)
    
    # Individual reps
    for rep in analysis.rep_data:
        duration = (rep.end_frame - rep.start_frame) / analysis.video_fps
        report.append(f"\nRep {rep.rep_number}:")
        report.append(f"  Quality Score: {rep.quality_score:.1f}/100")
        report.append(f"  Duration: {duration:.1f}s")
        
        if rep.issues:
            report.append(f"  Issues:")
            for issue in rep.issues:
                report.append(f"    - {issue}")
        else:
            report.append(f"  Perfect form! ✓")
        
        # Show key metrics
        if rep.metrics:
            report.append(f"  Metrics:")
            for key, value in rep.metrics.items():
                if isinstance(value, float):
                    report.append(f"    {key}: {value:.1f}")
                else:
                    report.append(f"    {key}: {value}")
    
    report.append("")
    report.append("=" * 60)
    
    return "\n".join(report)


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python ucoach_analyzer.py <video_path> <exercise_type>")
        print("Exercise types: squat, pushup, pullup")
        sys.exit(1)
    
    video_path = sys.argv[1]
    exercise_type_str = sys.argv[2].lower()
    
    exercise_map = {
        'squat': ExerciseType.SQUAT,
        'pushup': ExerciseType.PUSHUP,
        'pullup': ExerciseType.PULLUP,
    }
    
    if exercise_type_str not in exercise_map:
        print(f"Unknown exercise type: {exercise_type_str}")
        print("Available types: squat, pushup, pullup")
        sys.exit(1)
    
    exercise_type = exercise_map[exercise_type_str]
    
    # Run analysis
    analyzer = VideoAnalyzer()
    analysis = analyzer.analyze_video(video_path, exercise_type)
    
    # Print report
    report = format_analysis_report(analysis)
    print(report)
    
    # Save report
    report_path = video_path.rsplit('.', 1)[0] + '_analysis.txt'
    with open(report_path, 'w') as f:
        f.write(report)
    print(f"\nReport saved to: {report_path}")