# RollSync face enrollment setup

## Environment configuration

Generate one strong random secret and configure the **same value** in both the Node backend and the FastAPI camera service. Do not commit it to Git.

```bash
openssl rand -hex 32
```

Node backend environment:

```env
FACE_ENROLLMENT_SECRET=<generated-secret>
```

Camera service environment:

```env
FACE_ENROLLMENT_SECRET=<same-generated-secret>
SUPABASE_URL=<project-url>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

Keep the Supabase service-role key only in the private camera-service environment. Never add it to Vite variables or frontend code.

## Demo student account\n\nFor the controlled demo login, use email `student@rollsync.com` and password `password123`. The backend maps this demo student login to the existing active student record `24ECE002` / `PRATIK DAS`. This is a temporary demo credential, not production authentication.\n\n## Registration flow

1. The signed-in student opens **Student → Face Registration**.
2. The browser requests camera access only after the student presses **Start Camera**.
3. The page captures five poses: front, left, right, up and down.
4. The frontend requests a 10-minute, purpose-bound signed token from `POST /api/face-enrollment/token`. The Node API only issues it for the authenticated student's own active student record.
5. The browser sends the token and five JPEG images to `POST /api/camera/enroll`.
6. FastAPI verifies the HMAC signature and expiry, checks image size/type and exactly one face per image, averages and normalizes the InsightFace embeddings, then creates or updates that student's `face_profiles` row.
7. Raw image bytes are processed in memory and are not written to disk.

## Required deployment settings

- Frontend: set `VITE_API_URL` to the Node API base URL (including `/api`) and `VITE_CAMERA_API_URL` to the FastAPI service base URL.
- Node backend: set `FACE_ENROLLMENT_SECRET`.
- FastAPI: set the same `FACE_ENROLLMENT_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Both API services must be reachable over HTTPS from the phone browser.

## Notes

- Registration is normally a one-time operation per student. Re-registering replaces the existing embedding.
- The enrollment token is short-lived and bound to a student and purpose. It is not an attendance-session token.
- The existing attendance recognition endpoint continues to compare classroom detections against `face_profiles`.
- This flow is intended for the controlled RollSync demo. Before public production use, add server-side nonce consumption/rate limiting and a biometric data retention/deletion policy.
