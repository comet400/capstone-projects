"""
Base repetition counter
"""
from abc import ABC, abstractmethod
import numpy as np
from typing import List, Tuple, Dict, Optional
from ..utils.models import RepData, FormMetrics


class BaseCounter(ABC):
    """Abstract base class for rep counters"""
    
    def __init__(self, initial_state: str = "up"):
        self.initial_state = initial_state
        self.state = initial_state
        self.rep_count = 0
        self.current_rep_start: Optional[int] = None
        self.reps_data: List[RepData] = []
        self.frame_metrics: List[Tuple[int, FormMetrics]] = []
    
    @abstractmethod
    def process_frame(self, frame_num: int, metrics: FormMetrics) -> bool:
        pass
    
    def get_rep_count(self) -> int:
        return self.rep_count
    
    def get_reps_data(self) -> List[RepData]:
        return self.reps_data
    
    def reset(self):
        self.state = self.initial_state
        self.rep_count = 0
        self.current_rep_start = None
        self.reps_data = []
        self.frame_metrics = []
