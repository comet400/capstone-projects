"""
Squat form analysis — fixed to use range-of-motion (ROM) based depth detection
and corrected torso angle convention.
"""
import numpy as np
import math
from typing import Tuple, Dict, List, Optional
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import SQUAT_PARAMS


class SquatAnalyzer(FormChecker):
    """
    Biomechanically sensible squat analysis.

    Key fix: depth is judged by the RANGE OF MOTION (peak standing angle minus
    bottom angle) rather than an absolute angle at a single frame.  This means
    the analyzer must be fed the *worst-case / lowest* frame of each rep, which
    the rep-segmentation layer should already be providing as the frame nearest
    the inflection point.  If the caller instead passes a rolling window of
    frames, use `analyze_rep()` which accepts the full frame buffer and finds
    the bottom automatically.
    """

    # ------------------------------------------------------------------ #
    #  Public entry points                                                 #
    # ------------------------------------------------------------------ #

    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        """
        Analyse a single frame (assumed to be the bottom of the rep).
        Standing baseline is estimated as 175° if no history is available.
        """
        return self._analyze_frame(keypoints, standing_knee_angle=175.0)

    def analyze_rep(
        self,
        frame_buffer: List[np.ndarray],
        standing_frame: Optional[np.ndarray] = None,
    ) -> FormMetrics:
        """
        Analyse a full rep given a list of keypoint frames.

        Parameters
        ----------
        frame_buffer    : all keypoint frames captured during one rep
        standing_frame  : optional reference frame at full standing position;
                          if None the frame with the largest avg knee angle is used.

        This is the *preferred* entry point because it finds the true bottom
        frame automatically, giving accurate ROM-based depth scoring.
        """
        if not frame_buffer:
            m = FormMetrics()
            m.issues.append("No frames provided")
            return m

        required = [
            Keypoint.L_HIP, Keypoint.R_HIP,
            Keypoint.L_KNEE, Keypoint.R_KNEE,
            Keypoint.L_ANKLE, Keypoint.R_ANKLE,
            Keypoint.L_SHOULDER, Keypoint.R_SHOULDER,
        ]

        # --- find standing (peak) angle ---
        if standing_frame is not None and self.check_visibility(standing_frame, required):
            standing_angle = self._avg_knee_angle(standing_frame)
        else:
            # use the frame with the largest (most extended) knee angle in buffer
            angles = []
            for kp in frame_buffer:
                if self.check_visibility(kp, required):
                    angles.append(self._avg_knee_angle(kp))
            standing_angle = max(angles) if angles else 175.0

        # --- find bottom (lowest) frame = smallest avg knee angle ---
        bottom_kp = None
        bottom_angle = float("inf")
        for kp in frame_buffer:
            if self.check_visibility(kp, required):
                a = self._avg_knee_angle(kp)
                if a < bottom_angle:
                    bottom_angle = a
                    bottom_kp = kp

        if bottom_kp is None:
            m = FormMetrics()
            m.issues.append("Body not fully visible in any frame")
            return m

        return self._analyze_frame(bottom_kp, standing_knee_angle=standing_angle)

    # ------------------------------------------------------------------ #
    #  Core analysis (operates on the bottom frame + standing reference)  #
    # ------------------------------------------------------------------ #

    def _analyze_frame(
        self, keypoints: np.ndarray, standing_knee_angle: float = 175.0
    ) -> FormMetrics:
        metrics = FormMetrics()

        required = [
            Keypoint.L_HIP, Keypoint.R_HIP,
            Keypoint.L_KNEE, Keypoint.R_KNEE,
            Keypoint.L_ANKLE, Keypoint.R_ANKLE,
            Keypoint.L_SHOULDER, Keypoint.R_SHOULDER,
        ]

        if not self.check_visibility(keypoints, required):
            metrics.issues.append("Body not fully visible")
            return metrics

        # ----------------------------------------------------------- #
        # 1️⃣  DEPTH  —  ROM-based                                      #
        # ----------------------------------------------------------- #
        #
        # Knee angle convention used by calculate_joint_angle:
        #   180° = fully extended (standing)
        #    90° = parallel (thigh horizontal)
        #   <90° = below parallel
        #
        # Range of motion (ROM) = standing_angle - bottom_angle
        #   ROM ≥ 90° → deep squat (below parallel)
        #   ROM ≈ 80° → parallel
        #   ROM < 60° → shallow
        #
        left_knee  = self.calculate_joint_angle(keypoints, Keypoint.L_KNEE, Keypoint.L_HIP,  Keypoint.L_ANKLE)
        right_knee = self.calculate_joint_angle(keypoints, Keypoint.R_KNEE, Keypoint.R_HIP, Keypoint.R_ANKLE)
        avg_knee_angle = float((left_knee + right_knee) / 2)

        metrics.angles["left_knee"]  = float(left_knee)
        metrics.angles["right_knee"] = float(right_knee)
        metrics.angles["avg_knee"]   = avg_knee_angle
        metrics.angles["standing_knee_ref"] = standing_knee_angle

        rom = standing_knee_angle - avg_knee_angle          # degrees of bend achieved
        metrics.ratios["knee_rom_degrees"] = float(rom)

        ROM_MIN = SQUAT_PARAMS["depth_score_rom_min"]   # 45
        ROM_MAX = SQUAT_PARAMS["depth_score_rom_max"]   # 85
        depth_score = max(0.0, min(1.0, (rom - ROM_MIN) / (ROM_MAX - ROM_MIN)))
        metrics.ratios["depth"] = depth_score

        shallow_cutoff  = SQUAT_PARAMS["depth_rom_shallow_cutoff"]  # 45
        parallel_cutoff = SQUAT_PARAMS["depth_rom_parallel"]        # 60
        if rom < shallow_cutoff:
            metrics.issues.append("Very shallow squat — aim for at least parallel")
        elif rom < parallel_cutoff:
            metrics.issues.append("Slightly shallow — try to reach parallel or below")

        # ----------------------------------------------------------- #
        # 2️⃣  KNEE ALIGNMENT  —  continuous score                      #
        # ----------------------------------------------------------- #
        knee_distance = abs(keypoints[Keypoint.L_KNEE][0] - keypoints[Keypoint.R_KNEE][0])
        hip_distance  = abs(keypoints[Keypoint.L_HIP][0]  - keypoints[Keypoint.R_HIP][0])

        knee_ratio = float(knee_distance / hip_distance) if hip_distance > 1e-6 else 1.0
        metrics.ratios["knee_alignment"] = knee_ratio

        severe = SQUAT_PARAMS["knee_alignment_severe"]  # 0.65
        minor  = SQUAT_PARAMS["knee_alignment_minor"]   # 0.80
        floor  = SQUAT_PARAMS["knee_alignment_min"]     # 0.55

        if knee_ratio < severe:
            # Map floor→severe range to 0→0.5 score
            alignment_score = max(0.0, 0.5 * ((knee_ratio - floor) / max(severe - floor, 1e-6)))
            metrics.issues.append("Severe knee collapse (valgus) — push knees out over toes")
        elif knee_ratio < minor:
            # Map severe→minor range to 0.5→1.0 score
            alignment_score = 0.5 + 0.5 * ((knee_ratio - severe) / max(minor - severe, 1e-6))
            metrics.issues.append("Knee valgus — focus on pushing knees out")
        else:
            alignment_score = 1.0

        metrics.ratios["knee_alignment_score"] = alignment_score

        # ----------------------------------------------------------- #
        # 3️⃣  TORSO ANGLE  —  deviation from vertical                  #
        # ----------------------------------------------------------- #
        #
        # Bug fix: atan2(dx, dy) where dy is the vertical component gives the
        # angle from vertical directly (0° = perfectly upright).  The previous
        # code was computing values near 170° for an upright torso and then
        # comparing against a 35° threshold, which is always wrong.
        #
        mid_shoulder = (
            self.get_point(keypoints, Keypoint.L_SHOULDER) +
            self.get_point(keypoints, Keypoint.R_SHOULDER)
        ) / 2

        mid_hip = (
            self.get_point(keypoints, Keypoint.L_HIP) +
            self.get_point(keypoints, Keypoint.R_HIP)
        ) / 2

        dx = float(mid_shoulder[0] - mid_hip[0])
        # In image coords Y increases downward, so shoulder is at smaller Y than hip.
        # dy = hip_y - shoulder_y gives a positive "upward" vector length.
        dy = float(mid_hip[1] - mid_shoulder[1])

        # atan2(horizontal_offset, vertical_height) → angle from vertical
        torso_lean = abs(math.degrees(math.atan2(abs(dx), max(dy, 1e-6))))
        metrics.angles["torso_lean"] = torso_lean

        torso_max    = SQUAT_PARAMS["torso_angle_max"]      # 45
        torso_ideal  = SQUAT_PARAMS["torso_angle_ideal"]    # 30

        if torso_lean > torso_max:
            torso_score = max(0.0, 1.0 - (torso_lean - torso_ideal) / (torso_max * 1.5))
            metrics.issues.append("Excessive forward lean — brace core and keep chest up")
        elif torso_lean > torso_ideal:
            torso_score = 0.75
            metrics.issues.append("Moderate forward lean — focus on staying upright")
        else:
            torso_score = 1.0

        metrics.ratios["torso_score"] = torso_score

        # ----------------------------------------------------------- #
        # 4️⃣  STABILITY  —  left/right symmetry                        #
        # ----------------------------------------------------------- #
        asym_flag = SQUAT_PARAMS["stability_asymmetry_flag"]   # 20
        asym_max  = SQUAT_PARAMS["stability_score_max_diff"]   # 30

        knee_diff = abs(float(left_knee) - float(right_knee))
        stability_score = max(0.0, 1.0 - (knee_diff / asym_max))
        metrics.ratios["stability"] = stability_score

        if knee_diff > asym_flag:
            metrics.issues.append("Asymmetric squat — one side bending more than the other")

        return metrics