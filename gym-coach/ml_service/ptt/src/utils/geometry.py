"""
Geometric calculations for pose analysis
"""
import numpy as np
import math


def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """
    Calculate angle at point b formed by points a, b, c
    
    Args:
        a: First point (x, y)
        b: Vertex point (x, y)
        c: Third point (x, y)
    
    Returns:
        Angle in degrees
    """
    ba = a - b
    bc = c - b
    
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    
    if norm_ba < 1e-6 or norm_bc < 1e-6:
        return float('nan')
    
    cos_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    
    return math.degrees(math.acos(cos_angle))


def calculate_distance(p1: np.ndarray, p2: np.ndarray) -> float:
    """Calculate Euclidean distance between two points"""
    return np.linalg.norm(p1 - p2)


def calculate_midpoint(p1: np.ndarray, p2: np.ndarray) -> np.ndarray:
    """Calculate midpoint between two points"""
    return (p1 + p2) / 2


def calculate_slope_angle(p1: np.ndarray, p2: np.ndarray) -> float:
    """
    Calculate angle of slope between two points
    
    Returns:
        Angle in degrees from horizontal
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    return math.degrees(math.atan2(dy, dx))


def point_to_line_distance(point: np.ndarray, line_start: np.ndarray, line_end: np.ndarray) -> float:
    """Calculate perpendicular distance from point to line"""
    if np.allclose(line_start, line_end):
        return calculate_distance(point, line_start)
    
    line_vec = line_end - line_start
    point_vec = point - line_start
    
    line_len = np.linalg.norm(line_vec)
    line_unitvec = line_vec / line_len
    
    projection_length = np.dot(point_vec, line_unitvec)
    projection = line_start + projection_length * line_unitvec
    
    return calculate_distance(point, projection)