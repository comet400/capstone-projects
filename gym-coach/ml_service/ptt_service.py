from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
import tempfile, shutil, os
from uuid import uuid4
from typing import Dict, Any

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

jobs: Dict[str, Dict[str, Any]] = {}

def _process_job(job_id: str, exercise: str, ex_enum: ExerciseType, video_path: str):
    try:
        jobs[job_id]["status"] = "processing"

        analyzer = exercise_map[exercise][1]
        counter = RepCounter(ex_enum)
        processor = VideoProcessor(detector, analyzer, counter)

        analysis = processor.process_video(video_path, ex_enum)

        jobs[job_id]["status"] = "done"
        jobs[job_id]["result"] = {
            "exercise": exercise,
            "total_reps": analysis.total_reps,
            "average_quality": float(analysis.average_quality),
            "report": ReportFormatter.format_json_report(analysis),
            "annotated_frame": analysis.annotated_frame,
            "annotated_gif": analysis.annotated_gif,
        }

    except Exception as e:
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)

    finally:
        try:
            os.remove(video_path)
        except:
            pass


@app.post("/analyze", status_code=202)
async def analyze(
    background_tasks: BackgroundTasks,
    exercise: str = Form(...),
    video: UploadFile = File(...)
):
    if exercise not in exercise_map:
        raise HTTPException(status_code=400, detail="Invalid exercise")

    ex_enum, _ = exercise_map[exercise]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        shutil.copyfileobj(video.file, tmp)
        video_path = tmp.name

    job_id = str(uuid4())
    jobs[job_id] = {
        "status": "queued",
        "exercise": exercise,
    }

    background_tasks.add_task(_process_job, job_id, exercise, ex_enum, video_path)

    return {"job_id": job_id, "status": "queued"}


@app.get("/analyze/{job_id}")
async def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return jobs[job_id]