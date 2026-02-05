"""
Detection and analysis thresholds
"""

# Pose detection thresholds
POSE_CONFIDENCE_THRESHOLD = 0.25
KEYPOINT_CONFIDENCE_THRESHOLD = 0.5

# Quality scoring
QUALITY_SCORE_MAX = 100.0
QUALITY_SCORE_MIN = 0.0

# Issue penalties (deducted from quality score)
ISSUE_PENALTIES = {
    "Body not fully visible": 30,
    "Squat depth insufficient": 20,
    "Knees caving inward": 15,
    "Leaning too far forward": 10,
    "Hips sagging": 15,
    "Hips too high": 15,
    "Elbows flaring too wide": 10,
    "Pull higher": 25,
    "Chin should clear the bar": 25,
    "Excessive body swing": 15,
    "Control the movement": 10,
}

# Issue frequency threshold for overall issues (percentage)
COMMON_ISSUE_THRESHOLD = 0.3

# Minimum frames for a valid rep
MIN_REP_FRAMES = 10