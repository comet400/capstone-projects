"""
Data models for exercise analysis
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum


class ExerciseType(Enum):
    """Supported exercise types"""
    SQUAT = "squat"
    PUSHUP = "pushup"
    PULLUP = "pullup"
    BENCH_PRESS = "bench_press"
    BICEP_CURL = "bicep_curl"
    DEADLIFT = "deadlift"


@dataclass
class RepData:
    """Data for a single repetition"""
    rep_number: int
    start_frame: int
    end_frame: int
    quality_score: float  # 0-100
    issues: List[str] = field(default_factory=list)
    metrics: Dict[str, float] = field(default_factory=dict)
    
    @property
    def duration_frames(self) -> int:
        """Get rep duration in frames"""
        return self.end_frame - self.start_frame
    
    def get_duration_seconds(self, fps: float) -> float:
        """Get rep duration in seconds"""
        return self.duration_frames / fps


@dataclass
class ExerciseAnalysis:
    """Complete analysis of an exercise video"""
    exercise_type: ExerciseType
    total_reps: int
    average_quality: float
    rep_data: List[RepData] = field(default_factory=list)
    overall_issues: List[str] = field(default_factory=list)
    video_fps: float = 30.0
    total_frames: int = 0
    annotated_frame: Optional[str] = None  # base64-encoded JPEG with skeleton overlay
    annotated_gif: Optional[str] = None     # base64-encoded animated GIF with skeleton overlay
    
    @property
    def duration_seconds(self) -> float:
        """Total video duration in seconds"""
        return self.total_frames / self.video_fps if self.video_fps > 0 else 0
    
    def get_quality_grade(self) -> str:
        """Get letter grade based on average quality"""
        if self.average_quality >= 90:
            return "A"
        elif self.average_quality >= 80:
            return "B"
        elif self.average_quality >= 70:
            return "C"
        elif self.average_quality >= 60:
            return "D"
        else:
            return "F"


@dataclass
class FormMetrics:
    """Form metrics for a single frame"""
    angles: Dict[str, float] = field(default_factory=dict)
    ratios: Dict[str, float] = field(default_factory=dict)
    positions: Dict[str, float] = field(default_factory=dict)
    issues: List[str] = field(default_factory=list)
    
    def is_valid(self) -> bool:
        """Check if metrics contain valid data"""
        return bool(self.angles or self.ratios or self.positions)
