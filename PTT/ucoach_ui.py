import gradio as gr
import os
from ucoach_analyzer import (
    VideoAnalyzer,
    ExerciseType,
    format_analysis_report
)


class UCoachUI:
    """TESTER UI"""
    
    def __init__(self):
        self.analyzer = VideoAnalyzer()
    
    def analyze_workout(self, video_file, exercise_type):
        """
        Analyze uploaded workout video
        Args:
            video_file: Uploaded video file
            exercise_type: Selected exercise type (squat/pushup/pullup)
        Returns:
            Analysis report text
        """
        if video_file is None:
            return "❌ Please upload a video file"
        
        if exercise_type is None:
            return "❌ Please select an exercise type"
        
        try:
            # Map string to enum
            exercise_map = {
                'Squat': ExerciseType.SQUAT,
                'Push-up': ExerciseType.PUSHUP,
                'Pull-up': ExerciseType.PULLUP,
            }
            
            exercise_enum = exercise_map[exercise_type]
            
            # Analyze video
            analysis = self.analyzer.analyze_video(video_file, exercise_enum)
            
            # Format report
            report = format_analysis_report(analysis)
            
            # Create summary statistics
            summary = self._create_summary(analysis)
            
            return summary + "\n\n" + report
            
        except Exception as e:
            return f"❌ Error analyzing video: {str(e)}\n\nPlease ensure:\n- Video file is valid\n- Your body is visible in the frame\n- Lighting is adequate"
    
    def _create_summary(self, analysis):
        """Create a quick summary box"""
        lines = []
        lines.append("╔════════════════════════════════════════╗")
        lines.append("║         WORKOUT SUMMARY                ║")
        lines.append("╠════════════════════════════════════════╣")
        lines.append(f"║ Exercise:    {analysis.exercise_type.value.upper():<25} ║")
        lines.append(f"║ Total Reps:  {analysis.total_reps:<25} ║")
        lines.append(f"║ Avg Quality: {analysis.average_quality:.1f}/100{' ' * 18} ║")
        
        # Performance badge
        if analysis.average_quality >= 80:
            badge = "EXCELLENT"
        elif analysis.average_quality >= 60:
            badge = "GOOD"
        else:
            badge = "NEEDS WORK"
        
        lines.append(f"║ Rating:      {badge:<25} ║")
        lines.append("╚════════════════════════════════════════╝")
        
        return "\n".join(lines)
    
    def create_interface(self):
        theme = gr.themes.Soft(
            primary_hue="blue",
            neutral_hue="gray",
            font=["Inter", "system-ui", "sans-serif"],
        )

        with gr.Blocks(
            title="UCoach – AI Workout Form Checker",
        ) as demo:

            # ---------- Main Layout ----------
            with gr.Row(equal_height=True):

                # ---------- Input Column ----------
                with gr.Column(scale=1):

                    gr.Markdown("### Upload and Settings")

                    video_input = gr.Video(
                        label="Workout Video",
                        sources=["upload"],
                    )

                    exercise_dropdown = gr.Dropdown(
                        choices=["Squat", "Push-up", "Pull-up"],
                        label="Exercise Type",
                        value="Squat",
                    )

                    analyze_btn = gr.Button(
                        "Analyze Workout",
                        variant="primary",
                        size="lg",
                    )

                    gr.Markdown(
                        """
                        ---
                        **Recording guidelines**
                        - Capture the full body in frame
                        - Use a side-angle view
                        - Ensure adequate lighting
                        - Avoid background clutter
                        - Perform between 3 and 10 repetitions
                        """
                    )

                # ---------- Output Column ----------
                with gr.Column(scale=1):

                    gr.Markdown("### Analysis Output")

                    output_text = gr.Textbox(
                        label="Form Analysis Report",
                        lines=28,
                        max_lines=50,
                        interactive=False,
                    )

            # ---------- Wiring ----------
            analyze_btn.click(
                fn=self.analyze_workout,
                inputs=[video_input, exercise_dropdown],
                outputs=output_text,
            )

        return demo



def main():
    """Launch the UCoach web interface"""
    ui = UCoachUI()
    demo = ui.create_interface()
    demo.launch(
        share=False,
        server_name="127.0.0.1",
        server_port=7860,
        show_error=True
    )


if __name__ == "__main__":
    main()