# RollSync Architecture

## Overview
RollSync is a Smart Attendance Management System that combines RFID hardware, Web dashboards, and AI-powered Facial Recognition to automate classroom attendance.

## System Components

### 1. Frontend (React + Vite)
- **Hosting**: Vercel
- **Role**: Provides the UI for Admins to manage students and Teachers to review live attendance.

### 2. Main Backend (Node.js + Express)
- **Hosting**: Render
- **Database**: Supabase (PostgreSQL) via Prisma ORM
- **Role**: Source of truth. Handles CRUD operations, RFID scans, and attendance rules.

### 3. AI Camera Backend (Python + FastAPI)
- **Hosting**: Local / GPU Cloud
- **Role**: Runs the heavy `InsightFace` machine learning models. 
- **Flow**: 
  1. Receives frames from the classroom camera (or teacher's phone).
  2. Detects and extracts facial embeddings.
  3. Compares embeddings directly with the `face_profiles` table in Supabase.
  4. Marks attendance in the `camera_observations` table.

### 4. Hardware (ESP32)
- **Role**: Physical IoT device installed in classrooms. Scans student ID cards (RFID) and provides instant LED feedback. Communicates with the Node.js backend via REST API over Wi-Fi.
