"""
Exercise-specific parameters and configurations
"""

SQUAT_PARAMS = {

    "depth_rom_deep":           80,   # degrees of bend for a "deep" squat
    "depth_rom_parallel":       60,   # degrees of bend for "parallel"
    "depth_rom_shallow_cutoff": 45,   # below this → issue flagged

    "depth_score_rom_min":      45,   # (was effectively ~80° from the old formula)
    "depth_score_rom_max":      85,   # full marks — reachable for most people

    "knee_alignment_severe":    0.65,  # was 0.3 (too lenient to ever catch issues)
    "knee_alignment_minor":     0.80,  # new mild-warning band
    "knee_alignment_min":       0.55,  # absolute floor before score → 0

    "torso_angle_max":          45,   # flag threshold (matches the scorer)
    "torso_angle_ideal":        30,   # below this → full marks
    "torso_angle_moderate":     45,   # mild warning band upper bound

    "rep_up_threshold":         0.55, 
    "stability_asymmetry_flag": 20,   
    "stability_score_max_diff": 30,   
}

PUSHUP_PARAMS = {
    "elbow_angle_down": 120,  
    "elbow_angle_up": 150,  
    "body_alignment_min": 0.5,  
    "elbow_flare_max": 1.6, 
}

PULLUP_PARAMS = {
    "elbow_angle_up": 105,   
    "elbow_angle_down": 155, 
    "body_swing_max": 0.4,   
}

BENCH_PRESS_PARAMS = {
    # Rep detection
    "elbow_angle_down": 90,
    "elbow_angle_up": 150,

    # Bar mechanics
    "bar_path_verticality_min": 0.5,
    "bar_symmetry_max": 0.1,        # left/right wrist height diff

    # Joint stacking
    "wrist_stack_max": 0.08,        # wrist over elbow tolerance

    # Stability
    "shoulder_stability_max": 0.2,
    "scapular_retraction_min": 0.2, # optional expansion

    # Quality
    "lockout_angle_min": 160,
    "rom_min": 70,                  # minimum elbow ROM delta
    "eccentric_control_min": 0.2,   # tempo ratio placeholder
}

BICEP_CURL_PARAMS = {
    # Rep detection
    "elbow_angle_up": 60,
    "elbow_angle_down": 160,

    # Anti-cheating
    "elbow_drift_max": 0.22,
    "shoulder_movement_max": 0.15,
    "torso_sway_max": 0.15,

    # Quality control
    "rep_min_rom": 80,               # angle delta requirement
    "contraction_hold_min": 0.1,     # seconds (future timing support)
}

DEADLIFT_PARAMS = {
    # Phase detection
    "hip_angle_down": 115,
    "hip_angle_up": 150,
    "hinge_down": 0.28,
    "hinge_up": 0.45,

    # Movement type validation
    "knee_bend_max": 95,        # avoid squat-style DL
    "shin_verticality_max": 0.25,

    # Spine safety
    "back_round_max": 40,
    "asymmetry_max": 0.15,

    # Bar mechanics
    "bar_proximity_max": 0.15,  # wrist to ankle horizontal dist

    # Lockout quality
    "hip_drive_min": 150,
    "lockout_min": 165,

    # Rep quality
    "rep_min_rom": 80,
}

GLOBAL_FORM_PARAMS = {
    "symmetry_max": 0.15,
    "min_visibility_score": 0.6,
    "min_rep_duration": 0.4,
    "max_rep_duration": 5.0,
}


EXERCISE_PARAMS = {
    "squat": SQUAT_PARAMS,
    "pushup": PUSHUP_PARAMS,
    "pullup": PULLUP_PARAMS,
    "bench_press": BENCH_PRESS_PARAMS,
    "bicep_curl": BICEP_CURL_PARAMS,
    "deadlift": DEADLIFT_PARAMS
}

def get_exercise_params(exercise_type: str) -> dict:
    """Get parameters for a specific exercise"""
    return EXERCISE_PARAMS.get(exercise_type.lower(), {})
