"""
Report generation for exercise analysis
"""
from typing import List
from ..utils.models import ExerciseAnalysis, RepData


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
        """Generate a JSON-serializable report"""
        return {
            "exercise_type": analysis.exercise_type.value,
            "total_reps": analysis.total_reps,
            "average_quality": round(analysis.average_quality, 2),
            "grade": analysis.get_quality_grade(),
            "duration_seconds": round(analysis.duration_seconds, 2),
            "overall_issues": analysis.overall_issues,
            "reps": [
                {
                    "rep_number": rep.rep_number,
                    "quality_score": round(rep.quality_score, 2),
                    "duration_seconds": round(rep.get_duration_seconds(analysis.video_fps), 2),
                    "issues": rep.issues,
                    "metrics": {k: round(v, 2) if isinstance(v, float) else v 
                               for k, v in rep.metrics.items()}
                }
                for rep in analysis.rep_data
            ]
        }