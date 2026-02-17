"""
Exercise-specific parameters and configurations
"""

SQUAT_PARAMS = {
    "depth_threshold_parallel": 0.60,
    "depth_threshold_deep": 0.45,
    "knee_alignment_min": 0.3,
    "torso_angle_max": 50,
    "rep_up_threshold": 0.70
}


PUSHUP_PARAMS = {
    "elbow_angle_down": 120,  
    "elbow_angle_up": 150,  
    "body_alignment_min": 0.5,  
    "elbow_flare_max": 1.6, 
}

PULLUP_PARAMS = {
    "elbow_angle_up": 105,   # was 90
    "elbow_angle_down": 155, # slightly relaxed
    "body_swing_max": 0.4,   # slightly more tolerant
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
    "elbow_drift_max": 0.10,
    "shoulder_movement_max": 0.15,
    "torso_sway_max": 0.15,

    # Quality control
    "rep_min_rom": 80,               # angle delta requirement
    "contraction_hold_min": 0.1,     # seconds (future timing support)
}

DEADLIFT_PARAMS = {
    # Phase detection
    "hip_angle_down": 65,
    "hip_angle_up": 170,

    # Movement type validation
    "knee_bend_max": 110,       # avoid squat-style DL
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