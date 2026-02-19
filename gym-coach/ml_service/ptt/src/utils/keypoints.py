"""
Keypoint definitions for COCO-17 pose format
"""

class Keypoint:
    """COCO-17 keypoint indices"""
    NOSE = 0
    L_EYE = 1
    R_EYE = 2
    L_EAR = 3
    R_EAR = 4
    L_SHOULDER = 5
    R_SHOULDER = 6
    L_ELBOW = 7
    R_ELBOW = 8
    L_WRIST = 9
    R_WRIST = 10
    L_HIP = 11
    R_HIP = 12
    L_KNEE = 13
    R_KNEE = 14
    L_ANKLE = 15
    R_ANKLE = 16
    
    @classmethod
    def get_name(cls, index: int) -> str:
        """Get keypoint name by index"""
        names = {
            0: "nose", 1: "left_eye", 2: "right_eye",
            3: "left_ear", 4: "right_ear", 5: "left_shoulder",
            6: "right_shoulder", 7: "left_elbow", 8: "right_elbow",
            9: "left_wrist", 10: "right_wrist", 11: "left_hip",
            12: "right_hip", 13: "left_knee", 14: "right_knee",
            15: "left_ankle", 16: "right_ankle"
        }
        return names.get(index, "unknown")