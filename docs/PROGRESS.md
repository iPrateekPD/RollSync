# RollSync: Progress & Plan

## 🚀 Current Progress (As of Oct 2026)

### 1. Web Application (Frontend)
- **Framework**: React + Vite + TailwindCSS.
- **Portals Built**:
  - **Admin Dashboard**: Student management, class scheduling, and face training.
  - **Teacher Dashboard**: Live attendance monitoring, manual overrides, and camera-based attendance sessions.
  - **Student Dashboard (NEW)**: Fully functional student portal with personal attendance tracking.
- **Student Portal Features Completed**:
  - **Dashboard**: Live summary of attendance percentage, classes today, recent records, and face registration status.
  - **Face Registration**: Secure, in-browser interface for students to register their biometric face data directly, integrated with the Python backend.
  - **Attendance History**: Detailed, subject-wise breakdown of attendance with graphical charts (Recharts) and complete history.
  - **Student Directory / Profile**: Read-only view of academic identity, section, and credentials.
  - **Notifications**: Centralized view for alerts (e.g., low attendance warnings).
  - **Settings**: Profile, Security, Privacy (Face Data deletion), and Notification preferences.

### 2. Core Backend (Node.js)
- **Framework**: Express.js + Prisma ORM.
- **Database**: Supabase (PostgreSQL).
- **Recent Updates**:
  - Added new `/api/students/:id/dashboard` endpoint for aggregating student-specific data.
  - Added new `/api/students/:id/attendance` endpoint for complete historical attendance querying and chart compilation.
  - Mapped mock authentication to query real database student records (UUIDs) for flawless data retrieval.

### 3. AI Camera Backend (Python)
- **Framework**: FastAPI + InsightFace (Buffalo_L model) + OpenCV.
- **Features**:
  - **Endpoint `/api/camera/enroll`**: Extracts facial embeddings from a live photo and saves it to Supabase `face_profiles`. (Now accessible via Student Portal).
  - **Endpoint `/api/camera/session`**: Real-time frame processing against registered face embeddings for instant attendance marking.

### 4. Hardware (Firmware)
- **Platform**: ESP32 with PlatformIO.
- **Components**: RFID Reader (MFRC522), Status LEDs.

---

## 📋 Upcoming Plan & Next Steps

### Phase 1: Integration & End-to-End Test
1. Run a full end-to-end test of the Face Recognition pipeline using a live ngrok/localtunnel URL.
2. Log in as a student, register a face using the new Student Portal.
3. Log in as a teacher, start a camera session, and verify the student's face registers as "Present" in real-time.

### Phase 2: Hardware Testing
1. Flash the ESP32 firmware (`rfid_led_test`) to the physical board.
2. Verify Wi-Fi connectivity and backend API requests.
3. Test RFID tapping latency and visual LED feedback.

### Phase 3: Production Architecture (Future)
1. Move the Python AI backend to a dedicated GPU cloud instance (e.g., AWS EC2 or RunPod) to prevent OOM crashes on free-tier services.
2. Replace mobile-phone camera demo with permanent RTSP IP cameras (CCTV) in classrooms.
3. Implement a message queue (RabbitMQ/Redis) between the AI backend and Node.js backend for high-throughput frame processing.
