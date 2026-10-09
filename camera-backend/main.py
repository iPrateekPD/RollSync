import os
import uuid
import datetime
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from pydantic import BaseModel
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.4"))

# Init Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Init FaceAnalysis
face_app = FaceAnalysis(name='buffalo_l', root='~/.insightface')

@asynccontextmanager
async def lifespan(app: FastAPI):
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CameraSessionCreate(BaseModel):
    timetable_id: str
    subject_id: str

@app.post("/api/camera/session")
async def create_camera_session(req: CameraSessionCreate):
    # Create or find active attendance session
    existing_sess = supabase.table("attendance_sessions").select("*").eq("timetable_id", req.timetable_id).eq("active", True).execute()
    
    if len(existing_sess.data) > 0:
        att_sess_id = existing_sess.data[0]["id"]
    else:
        # Create a new attendance session
        att_res = supabase.table("attendance_sessions").insert({
            "subject_id": req.subject_id,
            "timetable_id": req.timetable_id,
            "classroom": "Demo Room",
            "start_time": datetime.datetime.utcnow().isoformat(),
            "end_time": (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat(),
            "active": True
        }).execute()
        att_sess_id = att_res.data[0]["id"]

    # Generate token
    token = str(uuid.uuid4())
    expires_at = (datetime.datetime.utcnow() + datetime.timedelta(minutes=15)).isoformat()
    
    # Save to supabase
    res = supabase.table("camera_sessions").insert({
        "attendance_session_id": att_sess_id,
        "token": token,
        "expires_at": expires_at
    }).execute()
    
    if len(res.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create session")
        
    return {"token": token, "session_id": res.data[0]["id"], "expires_at": expires_at}

@app.post("/api/camera/session/{token}/frame")
async def process_frame(token: str, file: UploadFile = File(...)):
    # 1. Validate Session
    session_res = supabase.table("camera_sessions").select("*").eq("token", token).eq("status", "active").execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Invalid or inactive session")
    
    session = session_res.data[0]
    
    # Check expiry
    expires_at = datetime.datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
    if datetime.datetime.now(datetime.timezone.utc) > expires_at:
        supabase.table("camera_sessions").update({"status": "expired"}).eq("id", session["id"]).execute()
        raise HTTPException(status_code=400, detail="Session expired")

    # 2. Decode image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    # 3. Detect faces
    faces = face_app.get(img)
    if not faces:
        return {"status": "success", "results": [{"status": "NO_FACE_DETECTED", "name": None}]}
        
    # 4. Fetch registered profiles
    profiles_res = supabase.table("face_profiles").select("*, students(id, name, roll_number)").execute()
    profiles = profiles_res.data
    
    results = []
    
    for face in faces:
        emb = face.normed_embedding
        best_match = None
        best_sim = -1.0
        
        for profile in profiles:
            db_emb = np.array(profile["embedding"])
            # Compute cosine similarity
            sim = np.dot(emb, db_emb)
            if sim > best_sim:
                best_sim = sim
                best_match = profile
                
        if best_sim >= FACE_MATCH_THRESHOLD and best_match:
            student = best_match["students"]
            
            # Log observation
            supabase.table("camera_observations").insert({
                "session_id": session["id"],
                "student_id": student["id"],
                "detected": True,
                "similarity": float(best_sim),
                "status": "verified"
            }).execute()
            
            results.append({
                "status": "VERIFIED",
                "name": student["name"],
                "roll_number": student["roll_number"],
                "similarity": float(best_sim)
            })
        else:
            # Log unknown observation
            supabase.table("camera_observations").insert({
                "session_id": session["id"],
                "detected": True,
                "similarity": float(best_sim) if best_sim != -1 else None,
                "status": "unknown"
            }).execute()
            
            results.append({
                "status": "UNKNOWN",
                "name": None,
                "similarity": float(best_sim) if best_sim != -1 else None
            })
            
    # Do NOT complete session yet. Finalization happens after 5 frames or timeout.

            
    return {"status": "success", "results": results}

@app.post("/api/camera/demo/session/{token}/frame")
async def process_demo_frame(token: str, capture_number: int, file: UploadFile = File(...)):
    # 1. Validate Session
    session_res = supabase.table("demo_class_sessions").select("*").eq("token", token).eq("status", "in_progress").execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Invalid or inactive session")
    
    session = session_res.data[0]
    
    # Check expiry
    expires_at = datetime.datetime.fromisoformat(session["ended_at"].replace("Z", "+00:00"))
    if datetime.datetime.now(datetime.timezone.utc) > expires_at:
        supabase.table("demo_class_sessions").update({"status": "processing"}).eq("id", session["id"]).execute()
        raise HTTPException(status_code=400, detail="Session expired")

    # 2. Decode image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    # 3. Detect faces
    faces = face_app.get(img)
    if not faces:
        # Upsert capture
        supabase.table("demo_class_captures").upsert({
            "session_id": session["id"],
            "capture_number": capture_number,
            "status": "success",
            "results": [{"status": "NO_FACE_DETECTED", "name": None}],
            "processed_at": datetime.datetime.utcnow().isoformat()
        }).execute()
        return {"status": "success", "results": [{"status": "NO_FACE_DETECTED", "name": None}]}
        
    # 4. Fetch registered profiles ONLY for students in the roster
    roster_res = supabase.table("demo_class_roster").select("student_id").eq("session_id", session["id"]).execute()
    student_ids = [r["student_id"] for r in roster_res.data]
    
    if not student_ids:
        profiles = []
    else:
        profiles_res = supabase.table("face_profiles").select("*, students(id, name, roll_number)").in_("student_id", student_ids).execute()
        profiles = profiles_res.data
    
    results = []
    
    for face in faces:
        emb = face.normed_embedding
        best_match = None
        best_sim = -1.0
        
        for profile in profiles:
            db_emb = np.array(profile["embedding"])
            # Compute cosine similarity
            sim = np.dot(emb, db_emb)
            if sim > best_sim:
                best_sim = sim
                best_match = profile
                
        if best_sim >= FACE_MATCH_THRESHOLD and best_match:
            student = best_match["students"]
            results.append({
                "status": "VERIFIED",
                "name": student["name"],
                "student_id": student["id"],
                "roll_number": student["roll_number"],
                "similarity": float(best_sim)
            })
        else:
            results.append({
                "status": "UNKNOWN",
                "name": None,
                "student_id": None,
                "similarity": float(best_sim) if best_sim != -1 else None
            })
            
    # Save capture result
    supabase.table("demo_class_captures").upsert({
        "session_id": session["id"],
        "capture_number": capture_number,
        "status": "success",
        "results": results,
        "processed_at": datetime.datetime.utcnow().isoformat()
    }).execute()

    return {"status": "success", "results": results}

@app.post("/api/camera/enroll/{student_id}")
async def enroll_face(student_id: str, file: UploadFile = File(...)):
    # Decode image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
        
    # Detect faces
    faces = face_app.get(img)
    if not faces:
        raise HTTPException(status_code=400, detail="No face detected in the image")
        
    if len(faces) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please ensure only the student is in the frame.")
        
    face = faces[0]
    embedding = face.normed_embedding.tolist()
    
    # Upsert profile
    existing_prof = supabase.table("face_profiles").select("*").eq("student_id", student_id).execute()
    if len(existing_prof.data) > 0:
        supabase.table("face_profiles").update({
            "embedding": embedding
        }).eq("student_id", student_id).execute()
    else:
        supabase.table("face_profiles").insert({
            "student_id": student_id,
            "embedding": embedding
        }).execute()
        
    return {"status": "success", "message": "Face trained successfully!"}

@app.post("/api/camera/session/{token}/finalize")
async def finalize_session(token: str):
    session_res = supabase.table("camera_sessions").select("*, attendance_sessions(*)").eq("token", token).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = session_res.data[0]
    
    # Get all observations for this session
    obs_res = supabase.table("camera_observations").select("*").eq("session_id", session["id"]).execute()
    observations = obs_res.data
    
    # Simple logic: At least 3 out of 5 frames must be verified for the same student
    # Note: In a real scenario, we check which student matched.
    student_counts = {}
    verified_count = 0
    best_student_id = None
    
    for obs in observations:
        if obs["status"] == "verified" and obs.get("student_id"):
            sid = obs["student_id"]
            student_counts[sid] = student_counts.get(sid, 0) + 1
            verified_count += 1
            if best_student_id is None or student_counts[sid] > student_counts[best_student_id]:
                best_student_id = sid

    final_verdict = "Needs Review"
    if verified_count >= 3 and best_student_id:
        final_verdict = "Present"
        
        # Save to attendance_records
        existing_att = supabase.table("attendance_records").select("*").eq("student_id", best_student_id).eq("session_id", session["attendance_session_id"]).execute()
        if not existing_att.data:
            supabase.table("attendance_records").insert({
                "student_id": best_student_id,
                "session_id": session["attendance_session_id"],
                "status": "present",
                "source": "camera_demo",
                "face_verification_summary": {
                    "total_frames": len(observations),
                    "verified_frames": verified_count,
                    "target_student": best_student_id
                }
            }).execute()

    supabase.table("camera_sessions").update({
        "status": "completed"
    }).eq("id", session["id"]).execute()
    
    return {
        "status": "success", 
        "verdict": final_verdict, 
        "total_frames": len(observations), 
        "verified": verified_count
    }

from fastapi import Form
@app.post("/api/camera/enroll/{student_id}/advanced")
async def enroll_face_advanced(
    student_id: str, 
    front: UploadFile = File(...),
    left: UploadFile = File(None),
    right: UploadFile = File(None),
    up: UploadFile = File(None),
    down: UploadFile = File(None)
):
    # Get student roll number
    student_res = supabase.table("students").select("roll_number").eq("id", student_id).execute()
    if not student_res.data:
        raise HTTPException(status_code=404, detail="Student not found")
        
    roll_number = student_res.data[0]["roll_number"]
    
    # Create directory for images
    base_dir = os.path.join(os.getcwd(), "student_faces", roll_number)
    os.makedirs(base_dir, exist_ok=True)
    
    files_map = {
        "front": front,
        "left": left,
        "right": right,
        "up": up,
        "down": down
    }
    
    embeddings = []
    
    for pose, file in files_map.items():
        if file is None:
            continue
            
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            continue
            
        faces = face_app.get(img)
        if faces and len(faces) == 1:
            embeddings.append(faces[0].normed_embedding.tolist())
            
            # Save the image locally
            img_path = os.path.join(base_dir, f"{pose}.jpg")
            cv2.imwrite(img_path, img)
            
    if not embeddings:
        raise HTTPException(status_code=400, detail="No valid faces detected in any image.")
        
    # Average the embeddings for a more robust profile, or just use the front face
    # Here we'll average them
    avg_embedding = np.mean(embeddings, axis=0).tolist()
    
    # Upsert profile
    existing_prof = supabase.table("face_profiles").select("*").eq("student_id", student_id).execute()
    if len(existing_prof.data) > 0:
        supabase.table("face_profiles").update({
            "embedding": avg_embedding
        }).eq("student_id", student_id).execute()
    else:
        supabase.table("face_profiles").insert({
            "student_id": student_id,
            "embedding": avg_embedding
        }).execute()
        
    return {"status": "success", "message": f"Successfully enrolled {len(embeddings)} poses for {roll_number}"}

@app.get("/api/camera/session/{token}/status")
async def get_session_status(token: str):
    session_res = supabase.table("camera_sessions").select("*, camera_observations(*, students(name, roll_number))").eq("token", token).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return session_res.data[0]
