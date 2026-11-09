# RollSync — AI Camera Specification

> **Status:** Based on the project progress notes and Prisma schema. Python implementation and live deployment must be independently inspected and tested.  
> **Last updated:** 10 November 2026

## 1. Purpose

The camera subsystem is intended to provide classroom visual evidence to support attendance review. The project progress document describes a Python/FastAPI service using InsightFace (Buffalo_L) and OpenCV.

The camera service is separate from the ESP32-S3 RFID device. The Android phone or classroom camera supplies images; the ESP32 is not responsible for facial recognition.

## 2. Intended architecture

```mermaid
flowchart LR
  Phone["Android phone / camera"] -->|Images or frames| API["Python FastAPI service"]
  API --> Detect["Face detection"]
  Detect --> Embed["Embedding extraction"]
  Embed --> Match["Compare enrolled profiles"]
  Match --> DB[("Face profiles / camera observations")]
  DB --> Core["Attendance review / Node backend"]
  Core --> Teacher["Teacher dashboard"]
```

Confirm whether the current Python service accesses Supabase directly or communicates through the Node.js backend. The architecture and progress notes describe direct comparison with `face_profiles`, but implementation details are not established here.

## 3. Data models

### `face_profiles`

Stores:
- Student association.
- Face embedding (`Float[]`).
- Reference count.
- Created/updated timestamps.

### `camera_sessions`

Stores:
- Attendance session association.
- Unique token.
- Camera type (default `demo_phone`).
- Status.
- Expiration time.
- Creation time.

### `camera_observations`

Stores:
- Camera session association.
- Optional recognized student.
- Detection flag.
- Optional similarity score.
- Status.
- Creation time.

### Demo camera workflow

The schema also defines:
- `demo_class_sessions`
- `demo_class_roster`
- `demo_class_captures`
- `demo_class_attendance`
- `demo_class_audit_logs`

The demo attendance table tracks recognized frames, valid frames, AI classification, teacher decision, and review status. Keep this separate from the general camera tables unless source code shows they are unified.

## 4. Enrollment workflow

The progress document reports an endpoint named `/api/camera/enroll` that extracts embeddings from a live photo and saves them to `face_profiles`.

Expected high-level steps:
1. Authenticate the student or authorized operator.
2. Capture a suitable enrollment image.
3. Validate image type and size.
4. Detect a usable face.
5. Extract embedding.
6. Associate embedding with student ID.
7. Store embedding securely.
8. Return enrollment status.

The endpoint's exact HTTP method, request format, authentication, response body, and validation must be verified from Python route source.

## 5. Camera session and frame processing

The progress document reports `/api/camera/session` for real-time frame processing.

Expected high-level behavior:
1. Teacher starts a camera session for an attendance session.
2. Service creates or validates a session token.
3. Phone uploads a frame/image.
4. Service detects faces.
5. Service extracts embeddings.
6. Service matches against enrolled profiles.
7. Service records observations.
8. Results are made available to teacher review.

The exact endpoint contract and whether the route is session creation, frame submission, or both must be confirmed from code.

## 6. Multi-frame presence logic

The product plan discusses capturing images periodically (previously every five minutes) and aggregating recognition across multiple frames.

The demo schema supports:
- `frames_recognized`
- `valid_frames`
- `ai_classification` (`Present`, `Absent`, `Maybe` per schema comment)
- `teacher_decision`
- `review_status`

No numerical recognition threshold is specified in the verified schema. Do not invent one.

A robust policy should:
- Require multiple valid observations.
- Avoid treating a single missed frame as proof of absence.
- Preserve uncertain cases for teacher review.
- Account for occlusion, lighting, camera angle, and enrollment image quality.
- Prevent duplicate observations from inflating evidence.

## 7. Camera capture client

The intended client is an Android phone used by the teacher or placed in the classroom. The earlier project plan described periodic image capture rather than connecting the camera directly to the ESP32.

Verify:
- Camera permission behavior.
- Capture interval.
- Image resolution and compression.
- Upload retry behavior.
- Session token handling.
- Network-loss handling.
- Whether images are stored or processed in memory.
- Whether the app uploads single images or video/frame streams.

## 8. Security and privacy

Face embeddings are biometric data. Before production use:

- Obtain appropriate consent and provide clear notice.
- Limit enrollment to the correct student identity.
- Encrypt network traffic.
- Restrict access to embeddings.
- Avoid public access to camera upload endpoints.
- Use short-lived session tokens.
- Define retention and deletion.
- Log administrative access and deletion events.
- Do not expose raw embeddings to frontend clients.
- Establish a manual correction process for recognition errors.

## 9. Performance and deployment

The progress document proposes moving the AI service to dedicated GPU hosting in the future to avoid memory pressure on free-tier services. It also mentions replacing phone-camera demos with RTSP IP cameras and considering RabbitMQ/Redis for higher-throughput processing.

These are future architecture options, not confirmed current deployments.

## 10. Validation checklist

- [ ] Python service installs from its dependency manifest.
- [ ] FastAPI app starts.
- [ ] Model loads successfully.
- [ ] Enrollment image is accepted.
- [ ] Face embedding is generated.
- [ ] Profile is stored for correct student.
- [ ] Camera session is created/validated.
- [ ] Phone image reaches service.
- [ ] Face matching returns expected result.
- [ ] Observation is persisted.
- [ ] Multi-frame evidence aggregates correctly.
- [ ] Teacher can review uncertain results.
- [ ] Teacher decision persists.
- [ ] Biometric data access and deletion are tested.
