import math
from typing import List, Tuple, Dict
from .base_counter import BaseCounter
from ..utils.models import RepData, FormMetrics, ExerciseType
from ...config.exercise_params import SQUAT_PARAMS, PUSHUP_PARAMS, PULLUP_PARAMS
from ...config.thresholds import ISSUE_PENALTIES


class RepCounter(BaseCounter):
    def __init__(self, exercise_type: ExerciseType, fps: int = 30):
        super().__init__()
        self.exercise_type = exercise_type
        self.fps = fps

        self.min_rep_frames = int(self.fps * 0.32)
        self.min_phase_frames = 3
        self.max_rep_frames = int(self.fps * 10)

        self._down_counter = 0
        self._up_counter = 0

        self._angle_buffer = []
        self._depth_buffer = []
        self._smooth_window = 3

    def process_frame(self, frame_num: int, metrics: FormMetrics) -> bool:
        self.frame_metrics.append((frame_num, metrics))

        if not metrics.is_valid():
            return False

        if self.exercise_type == ExerciseType.SQUAT:
            return self._process_squat(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PUSHUP:
            return self._process_pushup(frame_num, metrics)
        elif self.exercise_type == ExerciseType.PULLUP:
            return self._process_pullup(frame_num, metrics)

        return False

    def _smooth(self, buffer: List[float], new_val: float) -> float:
        if math.isnan(new_val):
            return float("nan")
        buffer.append(new_val)
        if len(buffer) > self._smooth_window:
            buffer.pop(0)
        return sum(buffer) / len(buffer)

    def _process_squat(self, frame_num: int, metrics: FormMetrics) -> bool:
        if "depth" not in metrics.ratios:
            return False

        depth = self._smooth(self._depth_buffer, metrics.ratios["depth"])
        if math.isnan(depth):
            return False

        down_th = SQUAT_PARAMS["depth_threshold_parallel"]
        up_th = SQUAT_PARAMS["rep_up_threshold"]

        if self.state == "up":
            if depth < down_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            if depth > up_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False


    def _process_pushup(self, frame_num: int, metrics: FormMetrics) -> bool:
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        down_th = PUSHUP_PARAMS["elbow_angle_down"]
        up_th = PUSHUP_PARAMS["elbow_angle_up"]

        if self.state == "up":
            if elbow < down_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            if elbow > up_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_pullup(self, frame_num: int, metrics: FormMetrics) -> bool:
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        up_th = PULLUP_PARAMS["elbow_angle_up"]
        down_th = PULLUP_PARAMS["elbow_angle_down"]

        if self.state == "down":
            if elbow < up_th:
                self._down_counter += 1
            else:
                self._down_counter = 0

            if self._down_counter >= self.min_phase_frames:
                self.state = "up"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "up":
            if elbow > down_th:
                self._up_counter += 1
            else:
                self._up_counter = 0

            if self._up_counter >= self.min_phase_frames:
                duration = frame_num - (self.current_rep_start or frame_num)
                if self.current_rep_start is not None and self.min_rep_frames <= duration <= self.max_rep_frames:
                    self._finalize_rep(frame_num)
                    self.state = "down"
                    self._up_counter = 0
                    return True
                self.state = "down"
                self._up_counter = 0

        return False

    def _finalize_rep(self, end_frame: int):
        self.rep_count += 1

        rep_frames = [
            (f, m) for f, m in self.frame_metrics
            if self.current_rep_start is not None and self.current_rep_start <= f <= end_frame
        ]

        quality_score, rep_issues = self._calculate_quality(rep_frames)
        avg_metrics = self._average_metrics(rep_frames)

        rep_data = RepData(
            rep_number=self.rep_count,
            start_frame=self.current_rep_start or end_frame,
            end_frame=end_frame,
            quality_score=quality_score,
            issues=rep_issues,
            metrics=avg_metrics
        )

        self.reps_data.append(rep_data)
        self.current_rep_start = None

    def _calculate_quality(self, rep_frames: List[Tuple[int, FormMetrics]]) -> Tuple[float, List[str]]:
        if not rep_frames:
            return 0.0, ["Incomplete rep"]

        all_issues = set()
        for _, metrics in rep_frames:
            all_issues.update(metrics.issues)

        score = 100.0
        rep_issues = []

        for issue in all_issues:
            for key, penalty in ISSUE_PENALTIES.items():
                if key in issue:
                    score -= penalty
                    rep_issues.append(issue)
                    break

        return max(0, score), list(set(rep_issues))

    def _average_metrics(self, rep_frames: List[Tuple[int, FormMetrics]]) -> Dict[str, float]:
        if not rep_frames:
            return {}

        all_angles = {}
        all_ratios = {}

        for _, metrics in rep_frames:
            for key, value in metrics.angles.items():
                if not math.isnan(value):
                    all_angles.setdefault(key, []).append(value)
            for key, value in metrics.ratios.items():
                if not math.isnan(value):
                    all_ratios.setdefault(key, []).append(value)

        avg_metrics = {}
        for key, values in all_angles.items():
            if values:
                avg_metrics[f"{key}_angle"] = sum(values) / len(values)
        for key, values in all_ratios.items():
            if values:
                avg_metrics[f"{key}_ratio"] = sum(values) / len(values)

        return avg_metrics
