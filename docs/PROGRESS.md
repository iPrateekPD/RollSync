# RollSync: Progress & Plan

## 🚀 Current Progress (As of Oct 2026)

### 1. Web Application (Frontend)
- **Framework**: React + Vite + TailwindCSS.
- **Portals Built**:
  - **Admin Dashboard**: Student management, class scheduling, and face training.
  - **Teacher Dashboard**: Live attendance monitoring, manual overrides, and camera-based attendance sessions.
- **Face Recognition Integration**: 
  - Added UI for Admins to "Train Faces" directly from the browser using the webcam.
  - Added UI for Teachers to generate a session QR code for the classroom camera.
  - Handled secure connection via environment variables (`VITE_CAMERA_API_URL`).

### 2. Core Backend (Node.js)
- **Framework**: Express.js + Prisma ORM.
- **Database**: Supabase (PostgreSQL).
- **Features**:
  - Defined database schemas (Students, Timetables, Attendance, Camera Sessions).
  - Handles attendance logging and core business logic.
  - Deployed on Render.

### 3. AI Camera Backend (Python)
- **Framework**: FastAPI + InsightFace (Buffalo_L model) + OpenCV.
- **Features**:
  - **Endpoint `/api/camera/enroll`**: Extracts facial embeddings from a live photo and saves it to Supabase `face_profiles`.
  - **Endpoint `/api/camera/session`**: Real-time frame processing against registered face embeddings for instant attendance marking.
  - Uses Cosine Similarity to verify faces with high accuracy.
- **Status**: Completed and exposed via `localtunnel` for testing on mobile devices.

### 4. Hardware (Firmware)
- **Platform**: ESP32 with PlatformIO.
- **Components**: RFID Reader (MFRC522), Status LEDs.
- **Features**:
  - Scans RFID cards.
  - Connects to Wi-Fi.
  - (In Progress) Sends HTTP requests to the Node.js backend to log attendance.

---

## 📋 Upcoming Plan & Next Steps

### Phase 1: Hardware Testing
1. Flash the ESP32 firmware (`rfid_led_test`) to the physical board.
2. Verify Wi-Fi connectivity and backend API requests.
3. Test RFID tapping latency and visual LED feedback.

### Phase 2: Refinement & Demo
1. Run a full end-to-end test of the Face Recognition pipeline using the localtunnel/mobile setup.
2. Resolve any Mixed Content (HTTPS vs HTTP) or Cross-Origin (CORS) errors on the live Vercel deployment.
3. Clean up UI states (loading spinners, success messages) for a polished demo.

### Phase 3: Production Architecture (Future)
1. Move the Python AI backend to a dedicated GPU cloud instance (e.g., AWS EC2 or RunPod) to prevent OOM crashes on free-tier services.
2. Replace mobile-phone camera demo with permanent RTSP IP cameras (CCTV) in classrooms.
3. Implement a message queue (RabbitMQ/Redis) between the AI backend and Node.js backend for high-throughput frame processing.
