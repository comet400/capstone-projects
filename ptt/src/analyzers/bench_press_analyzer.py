"""
Rock-solid Bench Press Rep Analyzer
Handles noise, false reps, and post-set motion.
"""

import numpy as np
from collections import deque
from .form_checker import FormChecker
from ..utils.keypoints import Keypoint
from ..utils.models import FormMetrics
from ...config.exercise_params import BENCH_PRESS_PARAMS


class BenchPressAnalyzer(FormChecker):

    def __init__(self):
        super().__init__()

        # ---- Rep Engine State ----
        self.rep_count = 0
        self.phase = "WAITING_TOP"

        self.min_angle = 999
        self.max_angle = 0

        self.frames_in_rep = 0
        self.frames_at_bottom = 0
        self.frames_at_top = 0
        self.frames_since_last_rep = 999

        self.set_finished = False
        self.idle_frames = 0

        # ---- Smoothing ----
        self.prev_angle = None
        self.alpha = 0.3  # EMA smoothing

        # ---- Tunables ----
        self.MIN_BOTTOM_FRAMES = 4
        self.MIN_TOP_FRAMES = 3
        self.MIN_REP_FRAMES = 6      # ~0.5s at 30fps
        self.SET_IDLE_FRAMES = 60     # ~2 seconds

    # -----------------------------------------------------

    def analyze(self, keypoints: np.ndarray) -> FormMetrics:
        metrics = FormMetrics()

        if self.set_finished:
            return metrics

        # ---- Visibility check ----
        left_ok = self.check_visibility(
            keypoints, [Keypoint.L_SHOULDER, Keypoint.L_ELBOW, Keypoint.L_WRIST]
        )
        right_ok = self.check_visibility(
            keypoints, [Keypoint.R_SHOULDER, Keypoint.R_ELBOW, Keypoint.R_WRIST]
        )

        if not left_ok and not right_ok:
            return metrics

        # ---- Angle extraction ----
        angles = []

        if left_ok:
            angles.append(self.calculate_joint_angle(
                keypoints, Keypoint.L_ELBOW,
                Keypoint.L_SHOULDER, Keypoint.L_WRIST
            ))

        if right_ok:
            angles.append(self.calculate_joint_angle(
                keypoints, Keypoint.R_ELBOW,
                Keypoint.R_SHOULDER, Keypoint.R_WRIST
            ))

        raw_angle = float(sum(angles) / len(angles))

        # ---- EMA smoothing ----
        if self.prev_angle is None:
            smoothed = raw_angle
        else:
            smoothed = self.alpha * raw_angle + (1 - self.alpha) * self.prev_angle

        self.prev_angle = smoothed

        metrics.angles["avg_elbow"] = smoothed

        print(f"[BENCH] angle={smoothed:.1f}")

        # ---- Idle detection (set end) ----
        if smoothed > BENCH_PRESS_PARAMS["elbow_angle_up"]:
            self.idle_frames += 1
        else:
            self.idle_frames = 0

        if self.idle_frames > self.SET_IDLE_FRAMES:
            self.set_finished = True
            print("🏁 SET FINISHED")
            return metrics

        # ---- State Machine ----

        self.frames_since_last_rep += 1

        if self.phase == "WAITING_TOP":
            if smoothed > BENCH_PRESS_PARAMS["elbow_angle_up"]:
                self.frames_at_top += 1
                if self.frames_at_top >= self.MIN_TOP_FRAMES:
                    self.phase = "DESCENDING"
                    self.frames_at_top = 0
                    self.min_angle = smoothed
                    self.max_angle = smoothed
            else:
                self.frames_at_top = 0

        elif self.phase == "DESCENDING":
            self.frames_in_rep += 1
            self.min_angle = min(self.min_angle, smoothed)

            if smoothed < BENCH_PRESS_PARAMS["elbow_angle_down"]:
                self.frames_at_bottom += 1
                if self.frames_at_bottom >= self.MIN_BOTTOM_FRAMES:
                    self.phase = "ASCENDING"
                    self.frames_at_bottom = 0
            else:
                self.frames_at_bottom = 0

        elif self.phase == "ASCENDING":
            self.frames_in_rep += 1
            self.max_angle = max(self.max_angle, smoothed)

            if smoothed > BENCH_PRESS_PARAMS["elbow_angle_up"]:
                self.frames_at_top += 1

                if self.frames_at_top >= self.MIN_TOP_FRAMES:

                    rom = self.max_angle - self.min_angle

                    if (
                        rom >= BENCH_PRESS_PARAMS["rom_min"] and
                        self.frames_in_rep >= self.MIN_REP_FRAMES and
                        self.frames_since_last_rep >= self.MIN_REP_FRAMES
                    ):
                        self.rep_count += 1
                        print(f"✅ REP COUNTED: {self.rep_count} (ROM={rom:.1f})")

                    # Reset rep state
                    self.phase = "DESCENDING"
                    self.frames_in_rep = 0
                    self.frames_at_top = 0
                    self.frames_since_last_rep = 0
                    self.min_angle = smoothed
                    self.max_angle = smoothed
            else:
                self.frames_at_top = 0

        metrics.reps = self.rep_count
        return metrics

    # -----------------------------------------------------

    def reset(self):
        self.__init__()
