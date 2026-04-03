"""
Detection and analysis thresholds - Enhanced Dynamic Grading System
"""

# Pose detection thresholds
POSE_CONFIDENCE_THRESHOLD = 0.20
KEYPOINT_CONFIDENCE_THRESHOLD = 0.35

# Quality scoring
QUALITY_SCORE_MAX = 100.0
QUALITY_SCORE_MIN = 0.0

# Issue frequency threshold for overall issues (percentage)
COMMON_ISSUE_THRESHOLD = 0.3

# Minimum frames for a valid rep
MIN_REP_FRAMES = 3


# ============================================================================
# EXERCISE-SPECIFIC GRADING CRITERIA
# Use these dictionaries by accessing with exercise type strings or enum values
# Example: GRADING_CRITERIA[ExerciseType.SQUAT] or GRADING_CRITERIA['squat']
# ============================================================================

SQUAT_GRADING = {
    "depth": {
        "weight": 0.35,
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "depth",           # ✅ matches metrics.ratios["depth"] in analyzer
        "thresholds": {
            # ROM-based depth score (0.0–1.0):
            #   1.0 = 85°+ ROM (deep, below parallel)
            #   0.5 = 65°  ROM (just at parallel)
            #   0.0 = 45°  ROM (very shallow)
            # Loosened so parallel squats land in "good" not "poor"
            "excellent":  0.70,   # ~80° ROM — deep squat
            "good":       0.50,   # ~65° ROM — parallel
            "acceptable": 0.30,   # ~55° ROM — slightly above parallel
            "poor":       0.10    # ~50° ROM — quarter squat (still gets some credit)
        },
        "severity_curve": "linear",      # exponential was too punishing for shallow-but-ok depth
        "description": "Depth achieved relative to full ROM (standing → bottom)"
    },

    "knee_alignment": {
        "weight": 0.25,
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "knee_alignment_score",  # ✅ fixed: was "knee_valgus" (didn't exist)
        #                                         matches metrics.ratios["knee_alignment_score"]
        "thresholds": {
            # knee_alignment_score is 0.0–1.0 (1.0 = knees perfectly tracking)
            "excellent":  0.90,
            "good":       0.70,
            "acceptable": 0.50,
            "poor":       0.25
        },
        "severity_curve": "quadratic",
        "description": "Knees tracking over toes (no valgus collapse)"
    },

    "torso_angle": {
        "weight": 0.20,
        "type": "range_max",             # lower lean = better, so penalise above threshold
        "metric_type": "angles",
        "metric_key": "torso_lean",      # ✅ fixed: was "torso_angle" — analyzer now outputs
        #                                   "torso_lean" (degrees of forward lean from vertical)
        "thresholds": {
            # torso_lean is degrees from vertical (0° = perfectly upright)
            # More lenient — some forward lean is normal, especially at depth
            "excellent":  20,    # ≤20° lean → full marks
            "good":       30,    # ≤30°
            "acceptable": 40,    # ≤40°
            "poor":       55     # >55° → poor (was 25° — far too strict)
        },
        "severity_curve": "linear",
        "description": "Forward lean from vertical during descent"
    },

    "tempo_control": {
        "weight": 0.15,
        "type": "duration_check",
        "metric_type": "temporal",
        "metric_key": "rep_duration",
        "ideal_min": 1.2,        # lowered: 1.5s was penalising fast-but-controlled reps
        "ideal_max": 6.0,        # raised: slow deliberate reps shouldn't be penalised
        "thresholds": {
            "excellent":  0.5,   # seconds outside ideal band
            "good":       1.2,
            "acceptable": 2.0,
            "poor":       3.5    # was 2.5 — a bit more forgiveness for beginners
        },
        "severity_curve": "linear",
        "description": "Controlled movement speed (seconds per rep)"
    },

    "stability": {
        "weight": 0.05,
        "type": "range_min",
        "metric_type": "ratios",
        "metric_key": "stability",       
        #                                   
        "thresholds": {
            # stability is 0.0–1.0 (1.0 = perfectly symmetric left/right)
            "excellent":  0.85,
            "good":       0.65,
            "acceptable": 0.45,
            "poor":       0.25
        },
        "severity_curve": "linear",
        "description": "Left/right symmetry throughout movement"
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

BENCH_PRESS_GRADING = {
    "range_of_motion": {
        "weight": 0.35,
        "type": "range_min",
        "metric_type": "angles",
        "metric_key": "avg_elbow",
        "thresholds": {
            "excellent": 75,
            "good": 85,
            "acceptable": 95,
            "poor": 110
        },
        "invert": True,
        "severity_curve": "exponential",
        "description": "Depth of press (elbow angle at bottom)"
    },

    "lockout_quality": {
        "weight": 0.20,
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "top_elbow_angle",
        "ideal_min": 160,
        "ideal_max": 180,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 15,
            "poor": 25
        },
        "severity_curve": "linear",
        "description": "Full lockout at top position"
    },

    "wrist_alignment": {
        "weight": 0.15,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "wrist_stack",
        "thresholds": {
            "excellent": 0.04,
            "good": 0.06,
            "acceptable": 0.08,
            "poor": 0.12
        },
        "severity_curve": "quadratic",
        "description": "Wrist stacked vertically over elbow"
    },

    "bar_symmetry": {
        "weight": 0.15,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "bar_symmetry",
        "thresholds": {
            "excellent": 0.03,
            "good": 0.06,
            "acceptable": 0.10,
            "poor": 0.18
        },
        "severity_curve": "quadratic",
        "description": "Even bar path left vs right"
    },

    "tempo_control": {
        "weight": 0.15,
        "type": "duration_check",
        "metric_type": "temporal",
        "ideal_min": 1.5,
        "ideal_max": 4.5,
        "thresholds": {
            "excellent": 0.5,
            "good": 1.0,
            "acceptable": 1.5,
            "poor": 2.5
        },
        "severity_curve": "linear",
        "description": "Controlled eccentric and concentric tempo"
    }
}

BICEP_CURL_GRADING = {
    "peak_contraction": {
        "weight": 0.35,
        "type": "range_min",
        "metric_type": "angles",
        "metric_key": "top_elbow_angle",
        "thresholds": {
            "excellent": 45,
            "good": 55,
            "acceptable": 65,
            "poor": 80
        },
        "invert": True,
        "severity_curve": "exponential",
        "description": "Peak bicep contraction"
    },

    "full_extension": {
        "weight": 0.20,
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "bottom_elbow_angle",
        "ideal_min": 160,
        "ideal_max": 180,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 20,
            "poor": 40
        },
        "severity_curve": "linear",
        "description": "Full arm extension at bottom"
    },

    "elbow_stability": {
        "weight": 0.20,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "elbow_drift",
        "thresholds": {
            "excellent": 0.08,
            "good": 0.14,
            "acceptable": 0.22,
            "poor": 0.35
        },
        "severity_curve": "linear",
        "description": "Elbows remain pinned"
    },

    "torso_control": {
        "weight": 0.15,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "torso_sway",
        "thresholds": {
            "excellent": 0.03,
            "good": 0.07,
            "acceptable": 0.12,
            "poor": 0.20
        },
        "severity_curve": "quadratic",
        "description": "Minimal swinging"
    },

    "tempo_control": {
        "weight": 0.10,
        "type": "duration_check",
        "metric_type": "temporal",
        "ideal_min": 1.0,
        "ideal_max": 3.5,
        "thresholds": {
            "excellent": 0.3,
            "good": 0.7,
            "acceptable": 1.2,
            "poor": 2.0
        },
        "severity_curve": "linear",
        "description": "Controlled movement tempo"
    }
}

DEADLIFT_GRADING = {
    "spine_neutrality": {
        "weight": 0.35,
        "type": "range_max",
        "metric_type": "angles",
        "metric_key": "torso_angle",
        "thresholds": {
            "excellent": 20,
            "good": 30,
            "acceptable": 40,
            "poor": 55
        },
        "severity_curve": "quadratic",
        "description": "Neutral spine maintenance"
    },

    "hip_hinge_quality": {
        "weight": 0.25,
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "hip_angle",
        "ideal_min": 60,
        "ideal_max": 100,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 20,
            "poor": 35
        },
        "severity_curve": "linear",
        "description": "Proper hip hinge mechanics"
    },

    "lockout_strength": {
        "weight": 0.15,
        "type": "range_check",
        "metric_type": "angles",
        "metric_key": "top_hip_angle",
        "ideal_min": 165,
        "ideal_max": 180,
        "thresholds": {
            "excellent": 5,
            "good": 10,
            "acceptable": 20,
            "poor": 40
        },
        "severity_curve": "linear",
        "description": "Full hip extension at top"
    },

    "bar_path": {
        "weight": 0.15,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "bar_proximity",
        "thresholds": {
            "excellent": 0.05,
            "good": 0.10,
            "acceptable": 0.15,
            "poor": 0.25
        },
        "severity_curve": "quadratic",
        "description": "Bar stays close to body"
    },

    "symmetry": {
        "weight": 0.10,
        "type": "range_max",
        "metric_type": "ratios",
        "metric_key": "asymmetry",
        "thresholds": {
            "excellent": 0.03,
            "good": 0.06,
            "acceptable": 0.10,
            "poor": 0.20
        },
        "severity_curve": "quadratic",
        "description": "Even left/right pull"
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
    "bench_press": BENCH_PRESS_GRADING,
    "bicep_curl": BICEP_CURL_GRADING,
    "deadlift": DEADLIFT_GRADING
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
