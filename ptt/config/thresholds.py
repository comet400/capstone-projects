"""
Detection and analysis thresholds - Enhanced Dynamic Grading System
"""

# Pose detection thresholds
POSE_CONFIDENCE_THRESHOLD = 0.25
KEYPOINT_CONFIDENCE_THRESHOLD = 0.5

# Quality scoring
QUALITY_SCORE_MAX = 100.0
QUALITY_SCORE_MIN = 0.0

# Issue frequency threshold for overall issues (percentage)
COMMON_ISSUE_THRESHOLD = 0.3

# Minimum frames for a valid rep
MIN_REP_FRAMES = 10


# ============================================================================
# EXERCISE-SPECIFIC GRADING CRITERIA
# Use these dictionaries by accessing with exercise type strings or enum values
# Example: GRADING_CRITERIA[ExerciseType.SQUAT] or GRADING_CRITERIA['squat']
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

# Grading scale mapping
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

# Map exercise types to their grading criteria
# This supports both string keys and ExerciseType enum lookups
GRADING_CRITERIA = {
    "squat": SQUAT_GRADING,
    "pushup": PUSHUP_GRADING,
    "pullup": PULLUP_GRADING,
}

# Legacy support - simplified ISSUE_RULES for backwards compatibility
ISSUE_RULES = {
    "body_visibility": {
        "type": "binary",
        "max_penalty": 40
    },
    "knees_caving": {
        "type": "angle_deviation",
        "metric_type": "angles",
        "metric_key": "knee_valgus",
        "ideal_min": 0.3,
        "tolerance": 0.15,
        "max_penalty": 25,
        "severity_curve": "quadratic"
    },
    "squat_depth": {
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "depth",
        "ideal_min": 0.60,
        "tolerance": 0.25,
        "max_penalty": 30,
        "severity_curve": "quadratic"
    },
    "elbow_flare": {
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "elbow_flare",
        "ideal_max": 1.6,
        "tolerance": 0.2,
        "max_penalty": 20,
        "severity_curve": "linear"
    },
    "body_swing": {
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "body_swing",
        "ideal_max": 0.3,
        "tolerance": 0.15,
        "max_penalty": 25,
        "severity_curve": "quadratic"
    },
}