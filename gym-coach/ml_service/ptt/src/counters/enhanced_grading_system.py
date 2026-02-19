"""
Enhanced Dynamic Grading System for Exercise Reps
Supports: Squats, Push-ups, Pull-ups
"""

import math
from typing import Dict, List, Tuple, Optional
from enum import Enum
from ..utils.models import ExerciseType
from ...config.exercise_params import EXERCISE_PARAMS, GLOBAL_FORM_PARAMS
from ...config.thresholds import GRADING_CRITERIA, GRADE_SCALE



# ============================================================================
# GRADING ENGINE
# ============================================================================

class RepGrader:
    """
    Dynamic grading system for exercise reps with weighted criteria
    """
    
    def __init__(self, exercise_type: ExerciseType, fps: int = 30):
        self.exercise_type = exercise_type
        self.fps = fps

        # Convert enum to string key
        if isinstance(exercise_type, ExerciseType):
            exercise_key = exercise_type.value
        else:
            exercise_key = str(exercise_type).lower()

        self.criteria = GRADING_CRITERIA.get(exercise_key)

        if self.criteria is None:
            raise ValueError(f"No grading criteria found for exercise: {exercise_key}")

        
    def grade_rep(self, rep_frames: List[Tuple[int, 'FormMetrics']]) -> Dict:
        """
        Grade a single rep based on exercise-specific weighted criteria
        
        Returns:
            Dict containing:
            - score: 0-100 numeric score
            - letter_grade: A+ through F
            - breakdown: score contribution per criterion
            - issues: list of problematic areas
            - feedback: specific improvement suggestions
        """
        if not rep_frames:
            return {
                "score": 0.0,
                "letter_grade": "F",
                "breakdown": {},
                "issues": ["Incomplete rep"],
                "feedback": ["Rep could not be analyzed"]
            }
        
        total_score = 0.0
        breakdown = {}
        issues = []
        feedback = []
        
        # Calculate duration for temporal metrics
        start_frame = rep_frames[0][0]
        end_frame = rep_frames[-1][0]
        duration_seconds = (end_frame - start_frame) / self.fps
        
        # Evaluate each criterion
        for criterion_name, criterion in self.criteria.items():
            criterion_score = self._evaluate_criterion(
                criterion_name, 
                criterion, 
                rep_frames,
                duration_seconds
            )
            
            # Weight the score
            weighted_score = criterion_score * criterion["weight"] * 100
            total_score += weighted_score
            
            breakdown[criterion_name] = {
                "raw_score": criterion_score,
                "weighted_score": weighted_score,
                "weight": criterion["weight"],
                "max_possible": criterion["weight"] * 100
            }
            
            # Identify issues and generate feedback
            if criterion_score < 0.7:  # Less than 70% on this criterion
                issues.append(criterion_name)
                feedback.append(self._generate_feedback(
                    criterion_name, 
                    criterion, 
                    criterion_score
                ))
        
        # Convert to letter grade
        letter_grade = self._score_to_grade(total_score)
        
        return {
            "score": round(total_score, 1),
            "letter_grade": letter_grade,
            "breakdown": breakdown,
            "issues": issues,
            "feedback": feedback,
            "duration_seconds": round(duration_seconds, 1)
        }
    
    def _evaluate_criterion(
        self, 
        criterion_name: str, 
        criterion: Dict, 
        rep_frames: List[Tuple[int, 'FormMetrics']],
        duration_seconds: float
    ) -> float:
        """
        Evaluate a single criterion and return score from 0.0 to 1.0
        """
        criterion_type = criterion["type"]
        metric_type = criterion.get("metric_type")
        
        # Handle temporal metrics (duration-based)
        if metric_type == "temporal":
            return self._evaluate_duration(criterion, duration_seconds)
        
        # Handle variance metrics (consistency across rep)
        if criterion_type == "variance_check":
            return self._evaluate_variance(criterion, rep_frames)
        
        # For other metrics, find the worst (or best) value across the rep
        metric_key = criterion.get("metric_key")
        metric_values = []
        
        for _, metrics in rep_frames:
            if metric_type == "angles":
                value = metrics.angles.get(metric_key)
            elif metric_type == "ratios":
                value = metrics.ratios.get(metric_key)
            else:
                continue
            
            if value is not None and not math.isnan(value):
                metric_values.append(value)
        
        if not metric_values:
            return 0.5  # Neutral score if no data
        
        # For most metrics, we want the worst value (conservative grading)
        # But for some (like depth, ROM), worst = minimum
        if criterion_type in ["range_min", "angle_deviation"]:
            target_value = min(metric_values)
        else:
            target_value = max(metric_values)
        
        # Evaluate based on type
        if criterion_type == "range_min":
            return self._evaluate_range_min(criterion, target_value)
        elif criterion_type == "range_max":
            return self._evaluate_range_max(criterion, target_value)
        elif criterion_type == "range_check":
            return self._evaluate_range_check(criterion, target_value)
        elif criterion_type == "angle_deviation":
            return self._evaluate_angle_deviation(criterion, target_value)
        
        return 0.5
    
    def _evaluate_range_min(self, criterion: Dict, value: float) -> float:
        """Score for metrics where higher is better (e.g., depth, ROM)"""
        thresholds = criterion["thresholds"]
        invert = criterion.get("invert", False)
        
        # If inverted, lower is better (e.g., elbow angle in pull-ups)
        if invert:
            if value <= thresholds["excellent"]:
                return 1.0
            elif value <= thresholds["good"]:
                return 0.9
            elif value <= thresholds["acceptable"]:
                return 0.75
            elif value <= thresholds["poor"]:
                return 0.5
            else:
                return self._apply_curve(0.3, criterion.get("severity_curve", "linear"))
        else:
            if value >= thresholds["excellent"]:
                return 1.0
            elif value >= thresholds["good"]:
                return 0.9
            elif value >= thresholds["acceptable"]:
                return 0.75
            elif value >= thresholds["poor"]:
                return 0.5
            else:
                return self._apply_curve(0.3, criterion.get("severity_curve", "linear"))
    
    def _evaluate_range_max(self, criterion: Dict, value: float) -> float:
        """Score for metrics where lower is better (e.g., swing, flare)"""
        thresholds = criterion["thresholds"]
        
        if value <= thresholds["excellent"]:
            return 1.0
        elif value <= thresholds["good"]:
            return 0.9
        elif value <= thresholds["acceptable"]:
            return 0.75
        elif value <= thresholds["poor"]:
            return 0.5
        else:
            return self._apply_curve(0.3, criterion.get("severity_curve", "linear"))
    
    def _evaluate_range_check(self, criterion: Dict, value: float) -> float:
        """Score for metrics with ideal range (e.g., torso angle)"""
        ideal_min = criterion["ideal_min"]
        ideal_max = criterion["ideal_max"]
        thresholds = criterion["thresholds"]
        
        # Calculate deviation from ideal range
        if ideal_min <= value <= ideal_max:
            deviation = 0
        elif value < ideal_min:
            deviation = ideal_min - value
        else:
            deviation = value - ideal_max
        
        # Score based on deviation
        if deviation <= thresholds["excellent"]:
            return 1.0
        elif deviation <= thresholds["good"]:
            return 0.9
        elif deviation <= thresholds["acceptable"]:
            return 0.75
        elif deviation <= thresholds["poor"]:
            return 0.5
        else:
            return self._apply_curve(0.3, criterion.get("severity_curve", "linear"))
    
    def _evaluate_angle_deviation(self, criterion: Dict, value: float) -> float:
        """Score for angle deviations (e.g., knee valgus)"""
        thresholds = criterion["thresholds"]
        
        if value <= thresholds["excellent"]:
            return 1.0
        elif value <= thresholds["good"]:
            return 0.9
        elif value <= thresholds["acceptable"]:
            return 0.75
        elif value <= thresholds["poor"]:
            return 0.5
        else:
            return self._apply_curve(0.3, criterion.get("severity_curve", "linear"))
    
    def _evaluate_duration(self, criterion: Dict, duration: float) -> float:
        """Score for tempo/duration metrics"""
        ideal_min = criterion["ideal_min"]
        ideal_max = criterion["ideal_max"]
        thresholds = criterion["thresholds"]
        
        if ideal_min <= duration <= ideal_max:
            deviation = 0
        elif duration < ideal_min:
            deviation = ideal_min - duration
        else:
            deviation = duration - ideal_max
        
        if deviation <= thresholds["excellent"]:
            return 1.0
        elif deviation <= thresholds["good"]:
            return 0.9
        elif deviation <= thresholds["acceptable"]:
            return 0.75
        elif deviation <= thresholds["poor"]:
            return 0.5
        else:
            return 0.3
    
    def _evaluate_variance(self, criterion: Dict, rep_frames: List) -> float:
        """Score for consistency/variance metrics"""
        metric_key = criterion["metric_key"]
        thresholds = criterion["thresholds"]
        
        values = []
        for _, metrics in rep_frames:
            value = metrics.ratios.get(metric_key)
            if value is not None and not math.isnan(value):
                values.append(value)
        
        if len(values) < 2:
            return 0.5
        
        # Calculate variance
        mean_val = sum(values) / len(values)
        variance = sum((x - mean_val) ** 2 for x in values) / len(values)
        
        if variance <= thresholds["excellent"]:
            return 1.0
        elif variance <= thresholds["good"]:
            return 0.9
        elif variance <= thresholds["acceptable"]:
            return 0.75
        elif variance <= thresholds["poor"]:
            return 0.5
        else:
            return 0.3
    
    def _apply_curve(self, base_score: float, curve_type: str) -> float:
        """Apply severity curve to penalize worse deviations more heavily"""
        if curve_type == "quadratic":
            return base_score ** 2
        elif curve_type == "exponential":
            return base_score ** 3
        return base_score
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade"""
        for grade, (min_score, max_score) in GRADE_SCALE.items():
            if min_score <= score < max_score:
                return grade
        return "F"
    
    def _generate_feedback(self, criterion_name: str, criterion: Dict, score: float) -> str:
        """Generate specific feedback for improvement"""
        description = criterion.get("description", criterion_name)
        
        if score < 0.5:
            intensity = "significant"
        elif score < 0.7:
            intensity = "moderate"
        else:
            intensity = "slight"
        
        feedback_templates = {
            "depth": f"Focus on {intensity} deeper squats - aim to get hips below knee level",
            "knee_alignment": f"Work on knee stability - prevent {intensity} inward collapse",
            "torso_angle": f"Adjust torso position - {intensity} improvement needed in forward lean",
            "elbow_depth": f"Increase descent depth - {intensity} deeper push-up needed",
            "body_alignment": f"Maintain plank position - {intensity} sagging/piking detected",
            "range_of_motion": f"Pull higher - {intensity} improvement needed in chin clearance",
            "body_control": f"Reduce momentum - {intensity} swinging/kipping detected",
            "tempo_control": f"Control your tempo - movement was too {'fast' if score > 0.5 else 'slow'}",
        }
        
        return feedback_templates.get(criterion_name, f"Improve {description}")


# ============================================================================
# HELPER CLASSES (Mock for demonstration)
# ============================================================================

class FormMetrics:
    """Mock FormMetrics class for demonstration"""
    def __init__(self):
        self.angles = {}
        self.ratios = {}


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    grader = RepGrader(ExerciseType.SQUAT, fps=30)
    
    # Mock rep data
    mock_frames = []
    for i in range(60):  # 2 seconds at 30fps
        metrics = FormMetrics()
        # Simulate decent squat metrics
        metrics.ratios["depth"] = 0.70  # Parallel squat
        metrics.angles["knee_valgus"] = 8  # Slight knee cave
        metrics.angles["torso_angle"] = 45  # Good torso angle
        metrics.ratios["balance_variance"] = 0.08  # Good stability
        mock_frames.append((i, metrics))
    
    result = grader.grade_rep(mock_frames)
    
    print(f"\n{'='*60}")
    print(f"REP GRADE REPORT - {ExerciseType.SQUAT.value.upper()}")
    print(f"{'='*60}")
    print(f"\nOverall Score: {result['score']}/100")
    print(f"Letter Grade: {result['letter_grade']}")
    print(f"Duration: {result['duration_seconds']}s")
    
    print(f"\n{'─'*60}")
    print("BREAKDOWN BY CRITERION:")
    print(f"{'─'*60}")
    for criterion_name, details in result['breakdown'].items():
        print(f"\n{criterion_name.replace('_', ' ').title()}:")
        print(f"  Weight: {details['weight']*100:.0f}%")
        print(f"  Score: {details['weighted_score']:.1f}/{details['max_possible']:.1f}")
        print(f"  Performance: {details['raw_score']*100:.0f}%")
    
    if result['feedback']:
        print(f"\n{'─'*60}")
        print("IMPROVEMENT SUGGESTIONS:")
        print(f"{'─'*60}")
        for i, suggestion in enumerate(result['feedback'], 1):
            print(f"{i}. {suggestion}")
    
    print(f"\n{'='*60}\n")