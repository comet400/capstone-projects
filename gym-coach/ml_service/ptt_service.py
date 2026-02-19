from fastapi import FastAPI, UploadFile, File, Form
import tempfile, shutil

from ptt.src.core import VideoProcessor, PoseDetector
from ptt.src.analyzers.bench_press_analyzer import BenchPressAnalyzer
from ptt.src.analyzers.bicep_curl_analyzer import BicepCurlAnalyzer
from ptt.src.analyzers.deadlift_analyzer import DeadliftAnalyzer
from ptt.src.analyzers import SquatAnalyzer, PushupAnalyzer, PullupAnalyzer
from ptt.src.counters import RepCounter
from ptt.src.utils import ExerciseType, ReportFormatter

app = FastAPI()
detector = PoseDetector.create_detector("yolo")

exercise_map = {
    "Squat": (ExerciseType.SQUAT, SquatAnalyzer()),
    "Pushup": (ExerciseType.PUSHUP, PushupAnalyzer()),
    "Pullup": (ExerciseType.PULLUP, PullupAnalyzer()),
    "Bench Press": (ExerciseType.BENCH_PRESS, BenchPressAnalyzer()),
    "Bicep Curl": (ExerciseType.BICEP_CURL, BicepCurlAnalyzer()),
    "Deadlift": (ExerciseType.DEADLIFT, DeadliftAnalyzer()),
}

@app.post("/analyze")
async def analyze(exercise: str = Form(...), video: UploadFile = File(...)):

    if exercise not in exercise_map:
        return {"error": "Invalid exercise"}

    ex_enum, analyzer = exercise_map[exercise]
    counter = RepCounter(ex_enum)
    processor = VideoProcessor(detector, analyzer, counter)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(video.file, tmp)
        path = tmp.name

    analysis = processor.process_video(path, ex_enum)

    return {
        "exercise": exercise,
        "total_reps": analysis.total_reps,
        "average_quality": float(analysis.average_quality),
        "report": ReportFormatter.format_text_report(analysis),
    }
