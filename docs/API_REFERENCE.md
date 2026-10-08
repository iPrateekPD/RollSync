# Backend API Reference

The Node.js Express backend serves as the bridge between the React frontend, the Supabase PostgreSQL database, and the MQTT hardware broker.

## Base URL
Local environment: `http://localhost:3000/api`

---

## Endpoints

### 1. `GET /api/timetable/today`
Fetches all classes for a specific teacher for the current day.

**Query Parameters:**
- `teacher_name` (String, Required) - The name of the teacher to filter classes for.
- `day` (String, Optional) - Override the current day (e.g., `MON`, `TUE`). Defaults to the actual system day.

**Response (200 OK):**
```json
{
  "day": "THU",
  "classes": [
    {
      "id": "uuid-here",
      "start_time": "08:00",
      "end_time": "09:00",
      "section": "ECE-A",
      "room": "RDB-05",
      "subjects": {
        "subject_name": "Microcontrollers and Applications"
      }
    }
  ]
}
```

### 2. MQTT Endpoints (Internal)
While not exposed via HTTP, the backend interacts with these topics:

**Subscribe: `classroom/+/rfid`**
- Triggered when an RFID card is scanned.
- Payload format: `{"uid": "XX XX XX XX"}`

**Publish: `classroom/+/status`**
- Emits response to hardware after processing a scan.
- Payload format: `{"status": "success", "message": "Attendance marked"}` or `{"status": "error", "message": "Invalid Card"}`
