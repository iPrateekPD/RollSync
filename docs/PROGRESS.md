# RollSync — Progress, Status & Roadmap

> **Last updated:** 10 November 2026  
> **Evidence basis:** Supplied project documentation, inspected Prisma schema, package manifests, firmware source, and previously recorded project tests. This is not a fresh live deployment or physical hardware test.

## 1. Status legend

| Status | Meaning |
|---|---|
| `IMPLEMENTED IN SOURCE` | Relevant code or UI exists in the repository. |
| `PARTIALLY IMPLEMENTED` | Some pieces exist; integration or behavior is incomplete. |
| `DEMO ONLY` | Prototype/demo workflow exists; production behavior is not established. |
| `TESTED LOCALLY` | Previously reported local test; not re-run for this report. |
| `TESTED ON HARDWARE` | Previously reported physical hardware test; not re-run for this report. |
| `NOT VERIFIED` | Evidence is insufficient to claim the feature works. |
| `PENDING` | Planned or known work remains. |
| `BLOCKED` | A dependency or issue prevents progress. |
| `FUTURE SCOPE` | Not required for the first functional demonstration. |

## 2. Executive summary

RollSync has a substantial software and firmware foundation. The repository includes a React frontend, a Node.js/Express backend, a Prisma schema with attendance/RFID/camera/demo models, and ESP32-S3 firmware for RFID, MQTT, OLED, BLE, and heartbeat functions.

The main remaining challenge is **end-to-end integration and verification**. In particular, the MQTT protocol and payloads are inconsistent across documents and firmware, the live database/deployment state must be checked, and the real camera-to-teacher-confirmation workflow needs an end-to-end test.

## 3. Frontend

The supplied progress document reports the following portal areas:

| Feature | Recorded status | Notes |
|---|---|---|
| React + Vite application | IMPLEMENTED IN SOURCE | Frontend package manifest exists. |
| Admin dashboard | IMPLEMENTED IN SOURCE | Reported student management, scheduling, and face training UI. Backend integration must be checked screen by screen. |
| Teacher dashboard | IMPLEMENTED IN SOURCE | Reported live attendance, manual overrides, camera sessions. |
| Student portal | IMPLEMENTED IN SOURCE | Reported dashboard, history, profile, notifications, settings. |
| Student face registration UI | PARTIALLY IMPLEMENTED | Progress doc says integrated with Python service; live integration not re-tested. |
| Attendance charts/history | IMPLEMENTED IN SOURCE | Recharts is declared; real-data correctness requires testing. |
| Demo login | IMPLEMENTED IN SOURCE | Git history includes admin/student demo login and teacher demo login changes. |
| Real authentication | NOT VERIFIED | Demo login is not proof of production authentication. |

## 4. Main backend

| Feature | Recorded status | Notes |
|---|---|---|
| Express + TypeScript backend | IMPLEMENTED IN SOURCE | `backend/package.json` exists. |
| Prisma ORM | IMPLEMENTED IN SOURCE | Schema and client dependency exist. |
| Supabase PostgreSQL configuration | IMPLEMENTED IN SOURCE | Prisma schema uses `DATABASE_URL` and `DIRECT_URL`; live project status needs checking. |
| Timetable today endpoint | DOCUMENTED | `GET /api/timetable/today` appears in supplied API reference. |
| Student dashboard/history endpoints | REPORTED IMPLEMENTED | Progress document lists `/api/students/:id/dashboard` and `/api/students/:id/attendance`; inspect current route source and test. |
| MQTT consumer and event processing | NOT VERIFIED END-TO-END | Firmware uses MQTT; topic/payload agreement remains unresolved. |
| Automated test suite | PENDING | Backend `test` script currently exits with “no test specified”. |

## 5. Database

| Feature | Status | Notes |
|---|---|---|
| Prisma schema | IMPLEMENTED IN SOURCE | 18 models in inspected schema. |
| Student/teacher/subject/timetable models | IMPLEMENTED IN SOURCE | Schema definitions exist. |
| RFID cards/events/devices | IMPLEMENTED IN SOURCE | Schema definitions exist. |
| Attendance sessions/records | IMPLEMENTED IN SOURCE | Schema definitions exist. |
| Face profiles/camera sessions/observations | IMPLEMENTED IN SOURCE | Schema definitions exist. |
| Demo-class workflow tables | IMPLEMENTED IN SOURCE | Separate demo tables exist. |
| Live Supabase schema synchronization | NOT VERIFIED | Check current Supabase project and compare migrations/schema. |
| Student CSV import | NOT VERIFIED | Confirm import scripts and row counts. |

## 6. RFID and ESP32-S3 hardware

The inspected firmware includes:
- Wi-Fi connection.
- MQTT connection/reconnect.
- MFRC522 initialization and UID polling.
- OLED initialization at I²C address `0x3C`.
- BLE scan setup and publishing.
- 30-second heartbeat.
- RFID event publishing.

Previously recorded physical tests:
- RFID UID reading and MQTT publishing were tested.
- Wi-Fi hotspot connection was tested.
- OLED I²C scanner detected `0x3C`.
- An RFID version register value of `0x82` was previously observed.

These are historical test notes, not fresh tests in this documentation task.

| Feature | Status |
|---|---|
| ESP32-S3 firmware project | IMPLEMENTED IN SOURCE |
| RC522 driver and polling | IMPLEMENTED IN SOURCE |
| OLED status display | IMPLEMENTED IN SOURCE |
| Wi-Fi and MQTT reconnect logic | IMPLEMENTED IN SOURCE |
| BLE scanning | IMPLEMENTED IN SOURCE; usefulness and privacy policy need review |
| Student-name display after backend resolution | NOT VERIFIED |
| MQTT acknowledgement callback | NOT VISIBLE IN INSPECTED MAIN SOURCE |
| NTP synchronization | PENDING / NOT VISIBLE IN INSPECTED MAIN SOURCE |
| OTA updates | PENDING / NOT VISIBLE IN INSPECTED MAIN SOURCE |
| Rechargeable battery enclosure | PENDING |
| Final physical pinout | VERIFY AGAINST `config.h` |

## 7. Camera and AI

The supplied progress document reports a Python/FastAPI service using InsightFace (Buffalo_L) and OpenCV, with enrollment and camera-session endpoints.

The Prisma schema includes face and camera models, and also a separate demo capture/attendance workflow.

| Feature | Status |
|---|---|
| Face profile schema | IMPLEMENTED IN SOURCE |
| Camera session/observation schema | IMPLEMENTED IN SOURCE |
| Demo class capture and attendance schema | IMPLEMENTED IN SOURCE |
| Face enrollment endpoint | REPORTED IMPLEMENTED; NOT RE-TESTED |
| Real-time face matching | REPORTED IMPLEMENTED; NOT RE-TESTED |
| Phone camera upload to service | NOT VERIFIED END-TO-END |
| Multi-frame presence threshold | NOT VERIFIED |
| Reconciliation with RFID | NOT VERIFIED |
| Teacher confirmation persisted in production workflow | NOT VERIFIED |
| GPU cloud deployment | FUTURE SCOPE |

## 8. Integration blockers

### Critical

1. **MQTT mismatch:** The original API document, MQTT contract, and firmware use different topic/payload conventions.
2. **Acknowledgement loop:** Firmware source inspected does not show a callback/subscription that receives backend acknowledgements and displays a resolved student name.
3. **Database state:** Verify the current Supabase project status, schema synchronization, and actual student data.
4. **Camera workflow:** Establish whether the production flow uses `camera_sessions`/`camera_observations` or the separate `demo_class_*` tables.
5. **End-to-end attendance:** Verify RFID + camera evidence reaches a teacher review screen and the final confirmation is persisted.

### High priority

- Verify actual backend routes and authentication.
- Verify frontend uses live API/database data rather than mocks.
- Verify the deployment URLs and health checks.
- Define status values and attendance reconciliation rules.
- Add tests for duplicate scans, unknown cards, inactive cards, no active session, and network loss.

## 9. Recommended development order

### Phase 1 — Recovery and baseline
- Check repository builds.
- Check Supabase status and database connectivity.
- Check frontend and backend environment variables.
- Confirm deployment status.
- Record a known-good local baseline.

### Phase 2 — RFID end-to-end
- Agree one MQTT topic and payload contract.
- Confirm backend subscription.
- Resolve UID through `rfid_cards`.
- Persist `rfid_events`.
- Create/update attendance evidence.
- Publish acknowledgement.
- Display student name on OLED.

### Phase 3 — Camera end-to-end
- Start a real camera session.
- Send images from phone.
- Run face detection/matching.
- Persist observations.
- Verify multi-frame logic.
- Return clear evidence to teacher dashboard.

### Phase 4 — Attendance review
- Reconcile RFID and camera evidence.
- Show Present / Absent / Maybe suggestions.
- Allow teacher corrections.
- Confirm attendance.
- Persist final status and audit information.
- Verify student portal history.

### Phase 5 — Reliability and release
- Test reconnects and duplicate events.
- Add backend tests.
- Secure MQTT and database access.
- Verify production deployment.
- Document operational recovery.

## 10. Definition of done for a functional demonstration

- [ ] Teacher can access the teacher dashboard.
- [ ] Correct timetable/classroom is selected.
- [ ] Attendance session can be started.
- [ ] A real RFID card UID is read by ESP32.
- [ ] Backend receives and resolves the UID.
- [ ] RFID event is persisted.
- [ ] Device receives acknowledgement.
- [ ] OLED displays the expected result.
- [ ] Phone camera sends an image to the AI service.
- [ ] Face recognition returns an observation.
- [ ] Attendance evidence appears in teacher review.
- [ ] Teacher can correct and confirm attendance.
- [ ] Final attendance persists in the database.
- [ ] Student portal shows the confirmed result.

## 11. Future scope

- Permanent classroom RTSP/CCTV cameras.
- Dedicated GPU hosting for AI service.
- Message queue between AI and core backend if throughput requires it.
- OTA firmware updates.
- Device provisioning and fleet management.
- Battery-powered portable hardware.
- Advanced monitoring and alerting.
