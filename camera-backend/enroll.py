import os
import sys
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

face_app = FaceAnalysis(name='buffalo_l', root='~/.insightface')
face_app.prepare(ctx_id=0, det_size=(640, 640))

def enroll(image_path, roll_number, name):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Could not read {image_path}")
        return
        
    faces = face_app.get(img)
    if not faces:
        print("No face detected")
        return
        
    face = faces[0]
    embedding = face.normed_embedding.tolist()
    
    # 1. Create student if doesn't exist
    res = supabase.table("students").select("*").eq("roll_number", roll_number).execute()
    if len(res.data) == 0:
        s_res = supabase.table("students").insert({
            "roll_number": roll_number,
            "name": name,
            "batch": "2024",
            "section": "A"
        }).execute()
        student_id = s_res.data[0]["id"]
    else:
        student_id = res.data[0]["id"]
        
    # 2. Add or update profile
    # Upsert requires checking if it exists by student_id or we can just delete then insert
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
    
    print(f"Successfully enrolled {name} ({roll_number})")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python enroll.py <image_path> <roll_number> <name>")
        sys.exit(1)
    enroll(sys.argv[1], sys.argv[2], sys.argv[3])
