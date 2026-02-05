import gradio as gr
from ptt.src.core import VideoProcessor, PoseDetector
from ptt.src.analyzers import SquatAnalyzer, PushupAnalyzer, PullupAnalyzer
from ptt.src.counters import RepCounter
from ptt.src.utils import ExerciseType, ReportFormatter


class UCoachUI:

    def __init__(self):
        self.detector = PoseDetector.create_detector("yolo")

    def analyze_workout(self, video_file, exercise_type):
        if not video_file:
            return "Please upload a video file"

        try:
            exercise_map = {
                "Squat": (ExerciseType.SQUAT, SquatAnalyzer()),
                "Pushup": (ExerciseType.PUSHUP, PushupAnalyzer()),
                "Pullup": (ExerciseType.PULLUP, PullupAnalyzer()),
            }

            exercise_enum, analyzer = exercise_map[exercise_type]
            counter = RepCounter(exercise_enum)
            processor = VideoProcessor(self.detector, analyzer, counter)

            analysis = processor.process_video(video_file, exercise_enum)
            report = ReportFormatter.format_text_report(analysis)

            return f"""
Exercise: {exercise_type}
Reps: {analysis.total_reps}
Quality Score: {analysis.average_quality:.1f}

{report}
"""

        except Exception as e:
            return f"Error: {str(e)}"

    def create_interface(self):
        with gr.Blocks(title="Exercise Analyzer") as demo:
            gr.Markdown("# Exercise Form Analyzer")
            gr.Markdown("Upload a video to analyze your exercise form.")

            with gr.Row():
                with gr.Column(scale=1):
                    video_input = gr.Video(label="Upload Video", sources=["upload"])
                    exercise_dropdown = gr.Dropdown(
                        choices=["Squat", "Pushup", "Pullup"],
                        value="Squat",
                        label="Exercise Type"
                    )
                    analyze_btn = gr.Button("Analyze", variant="primary")

                with gr.Column(scale=1):
                    output_text = gr.Textbox(
                        label="Analysis Results",
                        lines=20
                    )

            analyze_btn.click(
                fn=self.analyze_workout,
                inputs=[video_input, exercise_dropdown],
                outputs=output_text,
            )

        return demo


def main():
    ui = UCoachUI()
    demo = ui.create_interface()

    demo.launch(
        server_name="127.0.0.1",
        server_port=7860,
        share=False
    )


if __name__ == "__main__":
    main()