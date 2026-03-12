"""
Skeleton drawing utility – draws color-coded COCO-17 skeleton on a frame.

Green  = joint segment has no issues
Yellow = borderline / minor issue
Red    = issue detected on that segment
"""
import cv2
import numpy as np
import base64
from typing import List, Optional, Tuple
from .keypoints import Keypoint
from .models import FormMetrics


# COCO-17 skeleton connections as (from_idx, to_idx)
SKELETON_CONNECTIONS = [
    # Torso
    (Keypoint.L_SHOULDER, Keypoint.R_SHOULDER),
    (Keypoint.L_SHOULDER, Keypoint.L_HIP),
    (Keypoint.R_SHOULDER, Keypoint.R_HIP),
    (Keypoint.L_HIP, Keypoint.R_HIP),
    # Left arm
    (Keypoint.L_SHOULDER, Keypoint.L_ELBOW),
    (Keypoint.L_ELBOW, Keypoint.L_WRIST),
    # Right arm
    (Keypoint.R_SHOULDER, Keypoint.R_ELBOW),
    (Keypoint.R_ELBOW, Keypoint.R_WRIST),
    # Left leg
    (Keypoint.L_HIP, Keypoint.L_KNEE),
    (Keypoint.L_KNEE, Keypoint.L_ANKLE),
    # Right leg
    (Keypoint.R_HIP, Keypoint.R_KNEE),
    (Keypoint.R_KNEE, Keypoint.R_ANKLE),
]

# Map issue keywords → affected keypoint indices
# When an issue matches, the segments touching these keypoints turn red
ISSUE_JOINT_MAP = {
    # Squat issues
    "knee collapse": [Keypoint.L_KNEE, Keypoint.R_KNEE, Keypoint.L_HIP, Keypoint.R_HIP],
    "knee valgus": [Keypoint.L_KNEE, Keypoint.R_KNEE, Keypoint.L_HIP, Keypoint.R_HIP],
    "shallow": [Keypoint.L_KNEE, Keypoint.R_KNEE, Keypoint.L_HIP, Keypoint.R_HIP, Keypoint.L_ANKLE, Keypoint.R_ANKLE],
    "forward lean": [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER, Keypoint.L_HIP, Keypoint.R_HIP],
    "asymmetric": [Keypoint.L_KNEE, Keypoint.R_KNEE],
    # Pushup issues
    "hips sagging": [Keypoint.L_HIP, Keypoint.R_HIP, Keypoint.L_SHOULDER, Keypoint.R_SHOULDER],
    "hips too high": [Keypoint.L_HIP, Keypoint.R_HIP, Keypoint.L_SHOULDER, Keypoint.R_SHOULDER],
    "elbow": [Keypoint.L_ELBOW, Keypoint.R_ELBOW, Keypoint.L_SHOULDER, Keypoint.R_SHOULDER, Keypoint.L_WRIST, Keypoint.R_WRIST],
    # Bicep curl issues
    "curl higher": [Keypoint.L_ELBOW, Keypoint.R_ELBOW, Keypoint.L_WRIST, Keypoint.R_WRIST],
    "drift": [Keypoint.L_ELBOW, Keypoint.R_ELBOW, Keypoint.L_SHOULDER, Keypoint.R_SHOULDER],
    # Deadlift / bench / pullup
    "back": [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER, Keypoint.L_HIP, Keypoint.R_HIP],
    "core": [Keypoint.L_HIP, Keypoint.R_HIP, Keypoint.L_SHOULDER, Keypoint.R_SHOULDER],
    "grip": [Keypoint.L_WRIST, Keypoint.R_WRIST],
    "lockout": [Keypoint.L_KNEE, Keypoint.R_KNEE, Keypoint.L_HIP, Keypoint.R_HIP],
    "chest": [Keypoint.L_SHOULDER, Keypoint.R_SHOULDER],
}

# Colors in BGR for OpenCV
COLOR_GREEN = (128, 222, 74)     # #4ADE80
COLOR_YELLOW = (21, 204, 250)    # #FACC15
COLOR_RED = (113, 113, 248)      # #F87171


def _get_affected_keypoints(issues: List[str]) -> set:
    """Given a list of issue strings, return set of affected keypoint indices."""
    affected = set()
    for issue in issues:
        issue_lower = issue.lower()
        for keyword, joints in ISSUE_JOINT_MAP.items():
            if keyword in issue_lower:
                affected.update(joints)
    return affected


def _segment_color(kp_a: int, kp_b: int, affected: set) -> Tuple[int, int, int]:
    """Determine color for a skeleton segment based on affected joints."""
    a_affected = kp_a in affected
    b_affected = kp_b in affected
    if a_affected and b_affected:
        return COLOR_RED
    elif a_affected or b_affected:
        return COLOR_YELLOW
    return COLOR_GREEN


def draw_skeleton(
    frame: np.ndarray,
    keypoints: np.ndarray,
    metrics: Optional[FormMetrics] = None,
    confidence_threshold: float = 0.3,
    line_thickness: int = 3,
    circle_radius: int = 6,
) -> np.ndarray:
    """
    Draw a color-coded skeleton overlay on a frame.

    Args:
        frame: BGR image (numpy array, will be modified in-place)
        keypoints: (17, 3) array — x, y, confidence per COCO-17 keypoint
        metrics: FormMetrics with issues that determine coloring
        confidence_threshold: minimum confidence to draw a keypoint
        line_thickness: thickness of skeleton lines
        circle_radius: radius of joint circles

    Returns:
        Annotated frame (same reference, modified in-place)
    """
    output = frame.copy()
    issues = metrics.issues if metrics else []
    affected = _get_affected_keypoints(issues)

    # Draw connections
    for kp_a, kp_b in SKELETON_CONNECTIONS:
        if (keypoints[kp_a][2] < confidence_threshold or
                keypoints[kp_b][2] < confidence_threshold):
            continue

        pt_a = (int(keypoints[kp_a][0]), int(keypoints[kp_a][1]))
        pt_b = (int(keypoints[kp_b][0]), int(keypoints[kp_b][1]))
        color = _segment_color(kp_a, kp_b, affected)

        cv2.line(output, pt_a, pt_b, color, line_thickness, cv2.LINE_AA)

    # Draw joint circles on top
    for idx in range(17):
        if keypoints[idx][2] < confidence_threshold:
            continue
        pt = (int(keypoints[idx][0]), int(keypoints[idx][1]))
        color = COLOR_RED if idx in affected else COLOR_GREEN
        # Dark outline + colored fill
        cv2.circle(output, pt, circle_radius + 1, (0, 0, 0), -1, cv2.LINE_AA)
        cv2.circle(output, pt, circle_radius, color, -1, cv2.LINE_AA)

    return output


def annotate_frame_to_base64(
    frame: np.ndarray,
    keypoints: np.ndarray,
    metrics: Optional[FormMetrics] = None,
    jpeg_quality: int = 85,
) -> str:
    """
    Draw skeleton on frame and return as base64-encoded JPEG string.
    """
    annotated = draw_skeleton(frame, keypoints, metrics)
    _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
    return base64.b64encode(buffer).decode("utf-8")
