import math
from typing import List, Tuple, Dict
from .base_counter import BaseCounter
from ..utils.models import RepData, FormMetrics, ExerciseType
from ...config.exercise_params import SQUAT_PARAMS, PUSHUP_PARAMS, PULLUP_PARAMS, BENCH_PRESS_PARAMS, BICEP_CURL_PARAMS, DEADLIFT_PARAMS
from .enhanced_grading_system import RepGrader


class RepCounter(BaseCounter):
    """
    Enhanced rep counter with dynamic weighted grading system.
    Detection is tuned to be maximally lenient — any motion that
    matches the exercise pattern will be counted.
    """

    def __init__(self, exercise_type: ExerciseType, fps: int = 30):

        # Map exercises to proper initial phase
        initial_state_map = {
            ExerciseType.SQUAT: "up",
            ExerciseType.PUSHUP: "up",
            ExerciseType.PULLUP: "down",
            ExerciseType.BENCH_PRESS: "up",
            ExerciseType.BICEP_CURL: "down",
            ExerciseType.DEADLIFT: "up",
        }

        super().__init__(initial_state=initial_state_map.get(exercise_type, "up"))

        self.exercise_type = exercise_type
        self.fps = fps

        # Initialize grading system
        self.grader = RepGrader(exercise_type, fps)

        # Rep timing — very lenient: allow reps as fast as ~0.2s and as slow as 15s
        self.min_rep_frames = int(self.fps * 0.2)
        self.min_phase_frames = 1       # Just 1 frame needed to confirm a phase transition
        self.max_rep_frames = int(self.fps * 15)

        # Phase tracking
        self._down_counter = 0
        self._up_counter = 0

        # Smoothing buffers — separate per metric type to avoid cross-exercise contamination
        self._angle_buffer: List[float] = []
        self._depth_buffer: List[float] = []
        self._smooth_window = 2         # Reduced from 3 for less lag at phase transitions

    # ------------------------------------------------------------------
    # Core frame processing
    # ------------------------------------------------------------------

    def process_frame(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Process a single frame and detect rep completion."""
        self.frame_metrics.append((frame_num, metrics))

        if not metrics.is_valid():
            return False

        dispatch = {
            ExerciseType.SQUAT:       self._process_squat,
            ExerciseType.PUSHUP:      self._process_pushup,
            ExerciseType.PULLUP:      self._process_pullup,
            ExerciseType.BENCH_PRESS: self._process_bench_press,
            ExerciseType.BICEP_CURL:  self._process_bicep_curl,
            ExerciseType.DEADLIFT:    self._process_deadlift,
        }
        handler = dispatch.get(self.exercise_type)
        return handler(frame_num, metrics) if handler else False

    # ------------------------------------------------------------------
    # Smoothing helper
    # ------------------------------------------------------------------

    def _smooth(self, buffer: List[float], new_val: float) -> float:
        """Apply moving-average smoothing to reduce noise."""
        if math.isnan(new_val):
            return float("nan")
        buffer.append(new_val)
        if len(buffer) > self._smooth_window:
            buffer.pop(0)
        return sum(buffer) / len(buffer)

    # ------------------------------------------------------------------
    # Shared phase helpers
    # ------------------------------------------------------------------

    def _soft_increment(self, counter: int, condition: bool) -> int:
        """Increment counter when condition met, soft-decrement otherwise."""
        return counter + 1 if condition else max(0, counter - 1)

    def _check_duration(self, frame_num: int) -> bool:
        """Return True if elapsed frames since rep start are within the allowed window."""
        if self.current_rep_start is None:
            return False
        duration = frame_num - self.current_rep_start
        return self.min_rep_frames <= duration <= self.max_rep_frames

    # ------------------------------------------------------------------
    # Exercise-specific processors
    # ------------------------------------------------------------------

    def _process_squat(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Squat: track hip/knee depth ratio."""
        if "depth" not in metrics.ratios:
            return False

        depth = self._smooth(self._depth_buffer, metrics.ratios["depth"])
        if math.isnan(depth):
            return False

        down_th = SQUAT_PARAMS["depth_rom_parallel"]
        up_th   = SQUAT_PARAMS["rep_up_threshold"]

        rom_min = SQUAT_PARAMS["depth_score_rom_min"]
        rom_max = SQUAT_PARAMS["depth_score_rom_max"]
        down_th_ratio = max(0.0, min(1.0, (down_th - rom_min) / (rom_max - rom_min)))

        if self.state == "up":
            self._down_counter = self._soft_increment(self._down_counter, depth > down_th_ratio)

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            self._up_counter = self._soft_increment(self._up_counter, depth < up_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_pushup(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Push-up: track average elbow angle."""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        # Extra leniency on top of param defaults
        down_th = PUSHUP_PARAMS["elbow_angle_down"] + 10
        up_th   = PUSHUP_PARAMS["elbow_angle_up"]   - 10

        if self.state == "up":
            self._down_counter = self._soft_increment(self._down_counter, elbow < down_th)

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            self._up_counter = self._soft_increment(self._up_counter, elbow > up_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_pullup(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Pull-up: starts hanging (down), rises (up), returns."""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        up_th   = PULLUP_PARAMS["elbow_angle_up"]
        down_th = PULLUP_PARAMS["elbow_angle_down"]

        if self.state == "down":
            self._down_counter = self._soft_increment(self._down_counter, elbow < up_th)

            if self._down_counter >= self.min_phase_frames:
                self.state = "up"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "up":
            self._up_counter = self._soft_increment(self._up_counter, elbow > down_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "down"
                    self._up_counter = 0
                    return True
                self.state = "down"
                self._up_counter = 0

        return False

    def _process_bench_press(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Bench press: track average elbow angle."""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        down_th = BENCH_PRESS_PARAMS["elbow_angle_down"]
        up_th   = BENCH_PRESS_PARAMS["elbow_angle_up"]

        if self.state == "up":
            self._down_counter = self._soft_increment(self._down_counter, elbow < down_th)

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            self._up_counter = self._soft_increment(self._up_counter, elbow > up_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    def _process_bicep_curl(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Bicep curl: starts extended (down), curls (up), returns."""
        if "avg_elbow" not in metrics.angles:
            return False

        elbow = self._smooth(self._angle_buffer, metrics.angles["avg_elbow"])
        if math.isnan(elbow):
            return False

        down_th = BICEP_CURL_PARAMS["elbow_angle_down"]
        up_th   = BICEP_CURL_PARAMS["elbow_angle_up"]

        if self.state == "down":
            self._down_counter = self._soft_increment(self._down_counter, elbow < up_th)

            if self._down_counter >= self.min_phase_frames:
                self.state = "up"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "up":
            self._up_counter = self._soft_increment(self._up_counter, elbow > down_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "down"
                    self._up_counter = 0
                    return True
                self.state = "down"
                self._up_counter = 0

        return False

    def _process_deadlift(self, frame_num: int, metrics: FormMetrics) -> bool:
        """Deadlift: track hip angle (hinge)."""
        if "hip_angle" not in metrics.angles:
            return False

        hip = self._smooth(self._angle_buffer, metrics.angles["hip_angle"])
        if math.isnan(hip):
            return False

        down_th = DEADLIFT_PARAMS["hip_angle_down"]
        up_th   = DEADLIFT_PARAMS["hip_angle_up"]

        if self.state == "up":
            self._down_counter = self._soft_increment(self._down_counter, hip < down_th)

            if self._down_counter >= self.min_phase_frames:
                self.state = "down"
                self.current_rep_start = frame_num
                self._down_counter = 0

        elif self.state == "down":
            self._up_counter = self._soft_increment(self._up_counter, hip > up_th)

            if self._up_counter >= self.min_phase_frames:
                if self._check_duration(frame_num):
                    self._finalize_rep(frame_num)
                    self.state = "up"
                    self._up_counter = 0
                    return True
                self.state = "up"
                self._up_counter = 0

        return False

    # ------------------------------------------------------------------
    # Rep finalization
    # ------------------------------------------------------------------

    def _finalize_rep(self, end_frame: int):
        """Finalize a completed rep using the enhanced grading system."""
        self.rep_count += 1

        rep_frames = [
            (f, m) for f, m in self.frame_metrics
            if self.current_rep_start is not None and self.current_rep_start <= f <= end_frame
        ]

        grade_result = self.grader.grade_rep(rep_frames)

        quality_score = grade_result["score"]
        rep_issues    = grade_result["issues"]
        letter_grade  = grade_result["letter_grade"]
        feedback      = grade_result["feedback"]
        breakdown     = grade_result["breakdown"]

        avg_metrics = self._average_metrics(rep_frames)
        avg_metrics["letter_grade"]    = letter_grade
        avg_metrics["grade_breakdown"] = breakdown
        avg_metrics["feedback"]        = feedback

        rep_data = RepData(
            rep_number=self.rep_count,
            start_frame=self.current_rep_start or end_frame,
            end_frame=end_frame,
            quality_score=quality_score,
            issues=rep_issues,
            metrics=avg_metrics,
        )

        self.reps_data.append(rep_data)
        self.current_rep_start = None

    def _average_metrics(self, rep_frames: List[Tuple[int, FormMetrics]]) -> Dict[str, float]:
        """Calculate average metrics across all frames in a rep (kept for backwards compatibility)."""
        if not rep_frames:
            return {}

        all_angles: Dict[str, List[float]] = {}
        all_ratios: Dict[str, List[float]] = {}

        for _, metrics in rep_frames:
            for key, value in metrics.angles.items():
                if not math.isnan(value):
                    all_angles.setdefault(key, []).append(value)
            for key, value in metrics.ratios.items():
                if not math.isnan(value):
                    all_ratios.setdefault(key, []).append(value)

        avg_metrics: Dict[str, float] = {}
        for key, values in all_angles.items():
            if values:
                avg_metrics[f"{key}_angle"] = sum(values) / len(values)
        for key, values in all_ratios.items():
            if values:
                avg_metrics[f"{key}_ratio"] = sum(values) / len(values)

        return avg_metrics

    # ------------------------------------------------------------------
    # Session summary
    # ------------------------------------------------------------------

    def get_session_summary(self) -> Dict:
        """Get comprehensive session summary with grading insights."""
        if not self.reps_data:
            return {
                "total_reps": 0,
                "average_score": 0.0,
                "average_grade": "N/A",
                "grade_distribution": {},
                "common_issues": [],
                "best_rep": None,
                "worst_rep": None,
            }

        scores = [rep.quality_score for rep in self.reps_data]
        grades = [rep.metrics.get("letter_grade", "F") for rep in self.reps_data]

        grade_distribution: Dict[str, int] = {}
        for grade in grades:
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1

        issue_counts: Dict[str, int] = {}
        for rep in self.reps_data:
            for issue in rep.issues:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1

        common_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:3]

        best_rep  = max(self.reps_data, key=lambda r: r.quality_score)
        worst_rep = min(self.reps_data, key=lambda r: r.quality_score)

        return {
            "total_reps": self.rep_count,
            "average_score": round(sum(scores) / len(scores), 1),
            "average_grade": self._most_common_grade(grades),
            "grade_distribution": grade_distribution,
            "common_issues": [
                {
                    "issue": issue,
                    "count": count,
                    "percentage": round(count / self.rep_count * 100, 1),
                }
                for issue, count in common_issues
            ],
            "best_rep": {
                "rep_number": best_rep.rep_number,
                "score": best_rep.quality_score,
                "grade": best_rep.metrics.get("letter_grade", "N/A"),
            },
            "worst_rep": {
                "rep_number": worst_rep.rep_number,
                "score": worst_rep.quality_score,
                "grade": worst_rep.metrics.get("letter_grade", "N/A"),
            },
            "score_trend": scores,
        }

    def _most_common_grade(self, grades: List[str]) -> str:
        """Find the most common grade."""
        if not grades:
            return "N/A"
        return max(set(grades), key=grades.count)


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    from ..utils.models import FormMetrics, ExerciseType

    counter = RepCounter(ExerciseType.SQUAT, fps=30)
    print("Simulating squat workout...\n")

    for rep_num in range(5):
        print(f"Rep {rep_num + 1}:")

        for frame in range(30):
            metrics = FormMetrics()
            metrics.ratios["depth"] = max(0.3, 0.9 - (frame / 30) * 0.5)
            metrics.angles["knee_valgus"] = 5 + (frame % 10)
            metrics.angles["torso_angle"] = 45
            counter.process_frame(frame + rep_num * 60, metrics)

        for frame in range(30):
            metrics = FormMetrics()
            metrics.ratios["depth"] = max(0.3, 0.4 + (frame / 30) * 0.5)
            metrics.angles["knee_valgus"] = 5 + (frame % 10)
            metrics.angles["torso_angle"] = 45
            rep_completed = counter.process_frame(frame + 30 + rep_num * 60, metrics)

            if rep_completed:
                last_rep = counter.reps_data[-1]
                print(f"  ✓ Completed - Score: {last_rep.quality_score}/100 "
                      f"({last_rep.metrics.get('letter_grade', 'N/A')})")
                if last_rep.metrics.get("feedback"):
                    print(f"  Feedback: {last_rep.metrics['feedback'][0]}")
                print()

    summary = counter.get_session_summary()
    print("\n" + "=" * 60)
    print("SESSION SUMMARY")
    print("=" * 60)
    print(f"Total Reps: {summary['total_reps']}")
    print(f"Average Score: {summary['average_score']}/100")
    print(f"Average Grade: {summary['average_grade']}")
    print(f"\nGrade Distribution:")
    for grade, count in sorted(summary["grade_distribution"].items()):
        print(f"  {grade}: {count} reps")
    print(f"\nCommon Issues:")
    for issue_data in summary["common_issues"]:
        print(f"  • {issue_data['issue'].replace('_', ' ').title()}: "
              f"{issue_data['count']} reps ({issue_data['percentage']}%)")
    print(f"\nBest Rep:  #{summary['best_rep']['rep_number']} "
          f"({summary['best_rep']['score']}/100, {summary['best_rep']['grade']})")
    print(f"Worst Rep: #{summary['worst_rep']['rep_number']} "
          f"({summary['worst_rep']['score']}/100, {summary['worst_rep']['grade']})")
    print("=" * 60)