import math
from typing import List, Tuple, Dict
from .base_counter import BaseCounter
from ..utils.models import RepData, FormMetrics, ExerciseType
from ...config.exercise_params import SQUAT_PARAMS, PUSHUP_PARAMS, PULLUP_PARAMS
from .enhanced_grading_system import RepGrader


class RepCounter(BaseCounter):
    """
    Enhanced rep counter with dynamic weighted grading system
    """
    
    def __init__(self, exercise_type: ExerciseType, fps: int = 30):
        super().__init__()
        self.exercise_type = exercise_type
        self.fps = fps
        
        # Initialize the new grading system
        self.grader = RepGrader(exercise_type, fps)

        # Rep timing parameters
        self.min_rep_frames = int(self.fps * 0.32)
        self.min_phase_frames = 3
        self.max_rep_frames = int(self.fps * 10)

        # Phase tracking
        self._down_counter = 0
        self._up_counter = 0

        # Smoothing buffers
        self._angle_buffer = []
        self._depth_buffer = []
        self._smooth_window = 3

    def process_frame(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Process a single frame and detect rep completion"""
        self.frame_metrics.append((frame_num, metrics))

        if not metrics.is_valid():
            return False

        if self.exercise_type == ExerciseType.SQUAT:
            return self._process_squat(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PUSHUP:
            return self._process_pushup(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PULLUP:
            return self._process_pullup(frame_num, metrics)

        return False

    def _smooth(self, buffer: List[float], new_val: float) -> float:
        """Apply moving average smoothing to reduce noise"""
        if math.isnan(new_val):
            return float("nan")
        buffer.append(new_val)
        if len(buffer) > self._smooth_window:
            buffer.pop(0)
        return sum(buffer) / len(buffer)

    def _process_squat(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Process squat-specific logic"""
        if "depth" not in metrics.ratios:
            return False

        depth = self._smooth(self._depth_buffer, metrics.ratios["depth"])
        if math.isnan(depth):
            return False

        down_th = SQUAT_PARAMS["depth_threshold_parallel"]
        up_th = SQUAT_PARAMS["rep_up_threshold"]

        if self.state == "up":
            if depth < down_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            if depth > up_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_pushup(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Process push-up specific logic"""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        down_th = PUSHUP_PARAMS["elbow_angle_down"]
        up_th = PUSHUP_PARAMS["elbow_angle_up"]

        if self.state == "up":
            if elbow < down_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            if elbow > up_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_pullup(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Process pull-up specific logic"""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        up_th = PULLUP_PARAMS["elbow_angle_up"]
        down_th = PULLUP_PARAMS["elbow_angle_down"]

        if self.state == "down":
            if elbow < up_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "up"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "up":
            if elbow > down_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "down"
                    self._up_counter = 0
                    return True
                self.state = "down"
                self._up_counter = 0

        return False

    def _finalize_rep(self, end_frame: int):
        """
        Finalize a completed rep using the enhanced grading system
        """
        self.rep_count += 1

        # Extract frames for this specific rep
        rep_frames = [
            (f, m) for f, m in self.frame_metrics
            if self.current_rep_start is not None and self.current_rep_start <= f <= end_frame
        ]

        # Use new grading system
        grade_result = self.grader.grade_rep(rep_frames)

        # Extract quality metrics
        quality_score = grade_result["score"]
        rep_issues = grade_result["issues"]
        letter_grade = grade_result["letter_grade"]
        feedback = grade_result["feedback"]
        breakdown = grade_result["breakdown"]

        # Calculate average metrics for backwards compatibility
        avg_metrics = self._average_metrics(rep_frames)
        
        # Add grading details to metrics
        avg_metrics["letter_grade"] = letter_grade
        avg_metrics["grade_breakdown"] = breakdown
        avg_metrics["feedback"] = feedback

        # Create rep data
        rep_data = RepData(
            rep_number=self.rep_count,
            start_frame=self.current_rep_start or end_frame,
            end_frame=end_frame,
            quality_score=quality_score,
            issues=rep_issues,
            metrics=avg_metrics
        )

        self.reps_data.append(rep_data)
        self.current_rep_start = None

    def _average_metrics(self, rep_frames: List[Tuple[int, FormMetrics]]) -> Dict[str, float]:
        """
        Calculate average metrics across all frames in a rep
        (Kept for backwards compatibility)
        """
        if not rep_frames:
            return {}

        all_angles = {}
        all_ratios = {}

        for _, metrics in rep_frames:
            for key, value in metrics.angles.items():
                if not math.isnan(value):
                    all_angles.setdefault(key, []).append(value)
            for key, value in metrics.ratios.items():
                if not math.isnan(value):
                    all_ratios.setdefault(key, []).append(value)

        avg_metrics = {}
        for key, values in all_angles.items():
            if values:
                avg_metrics[f"{key}_angle"] = sum(values) / len(values)
        for key, values in all_ratios.items():
            if values:
                avg_metrics[f"{key}_ratio"] = sum(values) / len(values)

        return avg_metrics

    def get_session_summary(self) -> Dict:
        """
        Get comprehensive session summary with new grading insights
        """
        if not self.reps_data:
            return {
                "total_reps": 0,
                "average_score": 0.0,
                "average_grade": "N/A",
                "grade_distribution": {},
                "common_issues": [],
                "best_rep": None,
                "worst_rep": None
            }

        # Calculate statistics
        scores = [rep.quality_score for rep in self.reps_data]
        grades = [rep.metrics.get("letter_grade", "F") for rep in self.reps_data]
        
        # Grade distribution
        grade_distribution = {}
        for grade in grades:
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1

        # Common issues
        all_issues = []
        for rep in self.reps_data:
            all_issues.extend(rep.issues)
        
        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
        
        common_issues = sorted(
            issue_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]  # Top 3 issues

        # Best and worst reps
        best_rep = max(self.reps_data, key=lambda r: r.quality_score)
        worst_rep = min(self.reps_data, key=lambda r: r.quality_score)

        return {
            "total_reps": self.rep_count,
            "average_score": round(sum(scores) / len(scores), 1),
            "average_grade": self._most_common_grade(grades),
            "grade_distribution": grade_distribution,
            "common_issues": [{"issue": issue, "count": count, "percentage": round(count/self.rep_count*100, 1)} 
                            for issue, count in common_issues],
            "best_rep": {
                "rep_number": best_rep.rep_number,
                "score": best_rep.quality_score,
                "grade": best_rep.metrics.get("letter_grade", "N/A")
            },
            "worst_rep": {
                "rep_number": worst_rep.rep_number,
                "score": worst_rep.quality_score,
                "grade": worst_rep.metrics.get("letter_grade", "N/A")
            },
            "score_trend": scores  # For visualization
        }

    def _most_common_grade(self, grades: List[str]) -> str:
        """Find the most common grade"""
        if not grades:
            return "N/A"
        return max(set(grades), key=grades.count)


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    from ..utils.models import FormMetrics, ExerciseType
    
    # Example: Process a squat workout
    counter = RepCounter(ExerciseType.SQUAT, fps=30)
    
    # Simulate processing frames
    print("Simulating squat workout...\n")
    
    for rep_num in range(5):
        print(f"Rep {rep_num + 1}:")
        
        # Simulate going down
        for frame in range(30):  # 1 second down
            metrics = FormMetrics()
            metrics.ratios["depth"] = max(0.3, 0.9 - (frame / 30) * 0.5)  # Getting deeper
            metrics.angles["knee_valgus"] = 5 + (frame % 10)  # Some variance
            metrics.angles["torso_angle"] = 45
            counter.process_frame(frame + rep_num * 60, metrics)
        
        # Simulate going up
        for frame in range(30):  # 1 second up
            metrics = FormMetrics()
            metrics.ratios["depth"] = max(0.3, 0.4 + (frame / 30) * 0.5)  # Rising back up
            metrics.angles["knee_valgus"] = 5 + (frame % 10)
            metrics.angles["torso_angle"] = 45
            rep_completed = counter.process_frame(frame + 30 + rep_num * 60, metrics)
            
            if rep_completed:
                last_rep = counter.reps_data[-1]
                print(f"  ✓ Completed - Score: {last_rep.quality_score}/100 "
                      f"({last_rep.metrics.get('letter_grade', 'N/A')})")
                if last_rep.metrics.get('feedback'):
                    print(f"  Feedback: {last_rep.metrics['feedback'][0]}")
                print()
    
    # Print session summary
    summary = counter.get_session_summary()
    print("\n" + "="*60)
    print("SESSION SUMMARY")
    print("="*60)
    print(f"Total Reps: {summary['total_reps']}")
    print(f"Average Score: {summary['average_score']}/100")
    print(f"Average Grade: {summary['average_grade']}")
    print(f"\nGrade Distribution:")
    for grade, count in sorted(summary['grade_distribution'].items()):
        print(f"  {grade}: {count} reps")
    print(f"\nCommon Issues:")
    for issue_data in summary['common_issues']:
        print(f"  • {issue_data['issue'].replace('_', ' ').title()}: "
              f"{issue_data['count']} reps ({issue_data['percentage']}%)")
    print(f"\nBest Rep: #{summary['best_rep']['rep_number']} "
          f"({summary['best_rep']['score']}/100, {summary['best_rep']['grade']})")
    print(f"Worst Rep: #{summary['worst_rep']['rep_number']} "
          f"({summary['worst_rep']['score']}/100, {summary['worst_rep']['grade']})")
    print("="*60)