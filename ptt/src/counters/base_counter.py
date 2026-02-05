"""
Base repetition counter
"""
from abc import ABC, abstractmethod
import numpy as np
from typing import List, Tuple, Dict, Optional
from ..utils.models import RepData, FormMetrics


class BaseCounter(ABC):
    """Abstract base class for rep counters"""
    
    def __init__(self):
        self.state = "up"  # or "down"
        self.rep_count = 0
        self.current_rep_start: Optional[int] = None
        self.reps_data: List[RepData] = []
        self.frame_metrics: List[Tuple[int, FormMetrics]] = []
    
    @abstractmethod
    def process_frame(self, frame_num: int, metrics: FormMetrics) -> bool:
        """
        Process a frame's metrics and detect rep transitions
        
        Args:
            frame_num: Current frame number
            metrics: Form metrics for this frame
            
        Returns:
            True if a rep was just completed
        """
        pass
    
    def get_rep_count(self) -> int:
        """Get current rep count"""
        return self.rep_count
    
    def get_reps_data(self) -> List[RepData]:
        """Get all rep data"""
        return self.reps_data
    
    def reset(self):
        """Reset counter state"""
        self.state = "up"
        self.rep_count = 0
        self.current_rep_start = None
        self.reps_data = []
        self.frame_metrics = []