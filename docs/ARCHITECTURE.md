# RollSync System Architecture

RollSync is a modern, IoT-enabled Smart Attendance Management System. It replaces traditional paper-based attendance with an automated hardware-to-cloud pipeline.

## High-Level Components

1. **Hardware (IoT Edge Node)**
   - **ESP32 Microcontroller:** Connects to campus Wi-Fi and handles MQTT communication.
   - **MFRC522 RFID Reader:** Scans student ID cards.
   - **Status LEDs & Buzzer:** Provides immediate physical feedback (Success/Error).

2. **Message Broker (MQTT)**
   - Used for real-time, lightweight communication between the hardware and the backend.
   - **Topics:** `classroom/RDB-6/rfid`, `classroom/RDB-6/status`.

3. **Backend API (Node.js / Express)**
   - Hosted on Render.
   - Connects to the MQTT broker to ingest RFID scans.
   - Manages business logic (verifying if a class is active, validating student registration).
   - Serves REST endpoints to the Frontend.

4. **Database (Supabase / PostgreSQL)**
   - Managed via **Prisma ORM**.
   - Stores normalized tables: `students`, `teachers`, `subjects`, `timetable`, `attendance_sessions`, and `attendance_logs`.
   - Uses Row Level Security (RLS) policies for frontend security.

5. **Frontend (React / Vite + TailwindCSS)**
   - Hosted on Vercel.
   - **Teacher Dashboard:** Shows dynamically fetched timetables and allows manual override/confirmation of attendance.
   - Uses Supabase client for certain reads and the custom Backend API for business logic.

## Data Flow Diagram (Attendance Process)
1. Student taps RFID card on the scanner.
2. ESP32 publishes the UID to the MQTT broker.
3. Backend subscribes to MQTT, receives UID, and checks the current active session in Supabase.
4. Backend logs the attendance in `attendance_logs` and emits a success signal back via MQTT.
5. ESP32 flashes a green LED and beeps.
6. The Teacher Dashboard (via WebSocket/Polling) updates the "Present" count in real-time.
