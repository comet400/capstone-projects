"""
Report generation for exercise analysis
"""
from typing import List
from ..utils.models import ExerciseAnalysis, RepData
import numpy as np

class ReportFormatter:
    """Format analysis results into readable reports"""
    
    @staticmethod
    def format_text_report(analysis: ExerciseAnalysis) -> str:
        """Generate a text report"""
        lines = []
        lines.append("=" * 60)
        lines.append("UCoach Exercise Analysis Report")
        lines.append("=" * 60)
        lines.append(f"Exercise: {analysis.exercise_type.value.upper()}")
        lines.append(f"Total Reps: {analysis.total_reps}")
        lines.append(f"Average Quality: {analysis.average_quality:.1f}/100 (Grade: {analysis.get_quality_grade()})")
        lines.append(f"Duration: {analysis.duration_seconds:.1f}s")
        lines.append("")
        
        # Performance summary
        lines.append(ReportFormatter._get_performance_summary(analysis.average_quality))
        lines.append("")
        
        # Common issues
        if analysis.overall_issues:
            lines.append("Common Issues:")
            for issue in analysis.overall_issues:
                lines.append(f"  • {issue}")
        else:
            lines.append("✓ No major issues detected!")
        
        lines.append("")
        lines.append("-" * 60)
        lines.append("Rep Breakdown:")
        lines.append("-" * 60)
        
        # Individual reps
        for rep in analysis.rep_data:
            lines.extend(ReportFormatter._format_rep_section(rep, analysis.video_fps))
        
        lines.append("=" * 60)
        print("\n".join(lines))
        return "\n".join(lines)
    
    @staticmethod
    def _get_performance_summary(quality: float) -> str:
        """Get performance summary text"""
        if quality >= 80:
            return "Overall Performance: EXCELLENT ⭐"
        elif quality >= 60:
            return "Overall Performance: GOOD 👍"
        else:
            return "Overall Performance: NEEDS IMPROVEMENT 🔔"
    
    @staticmethod
    def _format_rep_section(rep: RepData, fps: float) -> List[str]:
        """Format a single rep section"""
        lines = []
        lines.append(f"\nRep {rep.rep_number}:")
        lines.append(f"  Quality: {rep.quality_score:.1f}/100")
        lines.append(f"  Duration: {rep.get_duration_seconds(fps):.1f}s")
        
        if rep.issues:
            lines.append("  Issues:")
            for issue in rep.issues:
                lines.append(f"    - {issue}")
        else:
            lines.append("  ✓ Perfect form!")
        
        if rep.metrics:
            lines.append("  Key Metrics:")
            for key, value in rep.metrics.items():
                if isinstance(value, float):
                    lines.append(f"    {key}: {value:.1f}")
                else:
                    lines.append(f"    {key}: {value}")
        
        return lines
    
    @staticmethod
    def format_json_report(analysis: ExerciseAnalysis) -> dict:
        """Generate a UI-optimized structured JSON report"""

        def to_native(value):
            if isinstance(value, (np.floating,)):
                return float(value)
            if isinstance(value, (np.integer,)):
                return int(value)
            return value

        rep_summaries = []
        issue_frequency = {}

        for rep in analysis.rep_data:
            duration = rep.get_duration_seconds(analysis.video_fps)

            # Track issue frequency
            for issue in rep.issues:
                issue_frequency[issue] = issue_frequency.get(issue, 0) + 1

            rep_summaries.append({
                "id": int(rep.rep_number),

                "quality": {
                    "score": float(round(to_native(rep.quality_score), 2)),
                    "grade": _grade_from_score(float(rep.quality_score))
                },

                "timing": {
                    "duration_seconds": float(round(to_native(duration), 2)),
                },

                "form": {
                    "issues": list(rep.issues),
                    "is_perfect": len(rep.issues) == 0
                },

                "metrics": {
                    k: float(round(to_native(v), 2))
                    if isinstance(v, (float, np.floating))
                    else int(to_native(v)) if isinstance(v, (int, np.integer))
                    else v
                    for k, v in rep.metrics.items()
                }
            })

        return {
            "metadata": {
                "exercise_type": str(analysis.exercise_type.value),
                "duration_seconds": float(round(to_native(analysis.duration_seconds), 2)),
                "video_fps": float(to_native(analysis.video_fps)),
            },

            "summary": {
                "total_reps": int(to_native(analysis.total_reps)),
                "average_quality": {
                    "score": float(round(to_native(analysis.average_quality), 2)),
                    "grade": analysis.get_quality_grade()
                },
                "performance_tier": _performance_tier(float(analysis.average_quality)),
                "has_issues": bool(len(analysis.overall_issues) > 0)
            },

            "issues": {
                "overall": list(analysis.overall_issues),
                "frequency": {k: int(v) for k, v in issue_frequency.items()}
            },

            "analytics": {
                "quality_trend": [
                    float(round(to_native(rep.quality_score), 2))
                    for rep in analysis.rep_data
                ],
                "rep_durations": [
                    float(round(to_native(rep.get_duration_seconds(analysis.video_fps)), 2))
                    for rep in analysis.rep_data
                ]
            },

            "reps": rep_summaries
        }


def _performance_tier(quality: float) -> str:
    if quality >= 80:
        return "excellent"
    elif quality >= 60:
        return "good"
    return "needs_improvement"


def _grade_from_score(score: float) -> str:
    if score >= 90: return "A"
    if score >= 80: return "B"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"
