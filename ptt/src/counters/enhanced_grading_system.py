"""
Enhanced Dynamic Grading System for Exercise Reps
Supports: Squats, Push-ups, Pull-ups
"""

import math
from typing import Dict, List, Tuple, Optional
from enum import Enum
from ..utils.models import ExerciseType



# ============================================================================
# EXERCISE-SPECIFIC GRADING CRITERIA
# ============================================================================

SQUAT_GRADING = {
    "depth": {
        "weight": 0.35,  # Most important for squats (35%)
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "depth",
        "thresholds": {
            "excellent": 0.75,   # Below parallel (hips below knees)
            "good": 0.65,        # Parallel
            "acceptable": 0.55,  # Slightly above parallel
            "poor": 0.45         # Quarter squat
        },
        "severity_curve": "exponential",
        "description": "Hip depth relative to knee height"
    },
    "knee_alignment": {
        "weight": 0.25,  # 25% of total score
        "type": "angle_deviation",
        "metric_type": "angles",
        "metric_key": "knee_valgus",
        "thresholds": {
            "excellent": 5,      # Degrees of knee cave (valgus collapse)
            "good": 10,
            "acceptable": 15,
            "poor": 25
        },
        "severity_curve": "quadratic",
        "description": "Knees tracking over toes (no caving)"
    },
    "torso_angle": {
        "weight": 0.20,  # 20% of total score
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "torso_angle",
        "ideal_min": 30,    # Degrees from vertical
        "ideal_max": 60,
        "thresholds": {
            "excellent": 5,      # Degrees outside ideal range
            "good": 10,
            "acceptable": 15,
            "poor": 25
        },
        "severity_curve": "linear",
        "description": "Torso angle during descent"
    },
    "tempo_control": {
        "weight": 0.15,  # 15% of total score
        "type": "duration_check",
        "metric_type": "temporal",
        "ideal_min": 1.5,        # Seconds for complete rep
        "ideal_max": 5.0,
        "thresholds": {
            "excellent": 0.5,    # Seconds outside ideal range
            "good": 1.0,
            "acceptable": 1.5,
            "poor": 2.5
        },
        "severity_curve": "linear",
        "description": "Controlled movement speed"
    },
    "stability": {
        "weight": 0.05,  # 5% of total score
        "type": "variance_check",
        "metric_type": "ratios",
        "metric_key": "balance_variance",
        "thresholds": {
            "excellent": 0.05,   # Variance in side-to-side balance
            "good": 0.10,
            "acceptable": 0.15,
            "poor": 0.25
        },
        "severity_curve": "linear",
        "description": "Balance and stability throughout movement"
    }
}

PUSHUP_GRADING = {
    "elbow_depth": {
        "weight": 0.40,  # Most critical (40%)
        "type": "range_min",
        "metric_type": "angles",
        "metric_key": "avg_elbow",
        "thresholds": {
            "excellent": 70,     # Elbow angle at bottom position (degrees)
            "good": 80,
            "acceptable": 90,
            "poor": 110
        },
        "invert": True,  # Lower angle = deeper = better
        "severity_curve": "exponential",
        "description": "Depth of descent (elbow angle)"
    },
    "body_alignment": {
        "weight": 0.30,  # 30% of total score
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "hip_angle",
        "ideal_min": 160,        # Nearly straight body (plank position)
        "ideal_max": 180,
        "thresholds": {
            "excellent": 5,      # Degrees outside ideal range
            "good": 10,
            "acceptable": 20,
            "poor": 35
        },
        "severity_curve": "quadratic",
        "description": "Straight body alignment (no sagging/piking)"
    },
    "elbow_flare": {
        "weight": 0.15,  # 15% of total score
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "elbow_flare",
        "thresholds": {
            "excellent": 1.3,    # Ratio of actual to ideal elbow position
            "good": 1.5,
            "acceptable": 1.7,
            "poor": 2.0
        },
        "severity_curve": "linear",
        "description": "Elbow position relative to body (45-degree angle ideal)"
    },
    "tempo_control": {
        "weight": 0.10,  # 10% of total score
        "type": "duration_check",
        "metric_type": "temporal",
        "ideal_min": 1.0,
        "ideal_max": 4.0,
        "thresholds": {
            "excellent": 0.3,
            "good": 0.7,
            "acceptable": 1.0,
            "poor": 2.0
        },
        "severity_curve": "linear",
        "description": "Controlled tempo"
    },
    "shoulder_position": {
        "weight": 0.05,  # 5% of total score
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "shoulder_protraction",
        "ideal_min": 10,
        "ideal_max": 30,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 15,
            "poor": 25
        },
        "severity_curve": "linear",
        "description": "Scapular position and shoulder health"
    }
}

PULLUP_GRADING = {
    "range_of_motion": {
        "weight": 0.40,  # Most important (40%)
        "type": "range_min",
        "metric_type": "angles",
        "metric_key": "avg_elbow",
        "thresholds": {
            "excellent": 40,     # Full ROM (small elbow angle at top)
            "good": 55,
            "acceptable": 70,
            "poor": 90
        },
        "invert": True,  # Smaller angle = better flexion
        "severity_curve": "exponential",
        "description": "Full range of motion (arm flexion at top)"
    },
    "chin_clearance": {
        "weight": 0.25,  # 25% of total score
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "chin_bar_ratio",
        "thresholds": {
            "excellent": 0.95,   # Chin well over bar
            "good": 0.85,        # Chin at bar level
            "acceptable": 0.75,  # Chin approaching bar
            "poor": 0.60         # Partial pull-up
        },
        "severity_curve": "quadratic",
        "description": "Chin position relative to bar"
    },
    "body_control": {
        "weight": 0.20,  # 20% of total score
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "body_swing",
        "thresholds": {
            "excellent": 0.10,   # Minimal swing/kipping
            "good": 0.20,
            "acceptable": 0.30,
            "poor": 0.50
        },
        "severity_curve": "quadratic",
        "description": "Strict form (minimal swinging/kipping)"
    },
    "shoulder_engagement": {
        "weight": 0.10,  # 10% of total score
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "shoulder_depression",
        "ideal_min": 15,
        "ideal_max": 45,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 15,
            "poor": 25
        },
        "severity_curve": "linear",
        "description": "Active shoulder engagement (scapular depression)"
    },
    "full_extension": {
        "weight": 0.05,  # 5% of total score
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "bottom_elbow_angle",
        "ideal_min": 170,    # Nearly full extension at bottom
        "ideal_max": 180,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 20,
            "poor": 40
        },
        "severity_curve": "linear",
        "description": "Full arm extension at bottom position"
    }
}


# Map exercise types to their grading criteria
GRADING_CRITERIA = {
    ExerciseType.SQUAT: SQUAT_GRADING,
    ExerciseType.PUSHUP: PUSHUP_GRADING,
    ExerciseType.PULLUP: PULLUP_GRADING
}


# ============================================================================
# GRADING SCALE
# ============================================================================

GRADE_SCALE = {
    "A+": (97, 100),
    "A": (93, 97),
    "A-": (90, 93),
    "B+": (87, 90),
    "B": (83, 87),
    "B-": (80, 83),
    "C+": (77, 80),
    "C": (73, 77),
    "C-": (70, 73),
    "D": (60, 70),
    "F": (0, 60)
}


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
        self.criteria = GRADING_CRITERIA[exercise_type]
        
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