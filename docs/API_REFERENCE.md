# RollSync — Backend API Reference

> **Last updated:** 10 November 2026  
> **Backend:** Node.js + Express  
> **Local base URL documented by project:** `http://localhost:3000/api`

## 1. Scope and accuracy

This document records the API information present in the supplied project documentation and the endpoint examples previously inspected. A complete route-by-route inventory requires inspecting every file under `backend/src` (routes, controllers, middleware, and services). Endpoints not evidenced by the inspected documentation are not invented here.

**Known documented HTTP endpoint:** `GET /api/timetable/today`.

The MQTT topics listed in the original API document conflict with the separate MQTT contract and must be reconciled with firmware and backend implementation. See [mqtt-contract.md](mqtt-contract.md).

## 2. Base URL

| Environment | Base URL |
|---|---|
| Local development | `http://localhost:3000/api` |
| Deployed backend | Not verified; configure from the actual hosting environment |

Do not assume a production URL until the deployment configuration and health check have been verified.

## 3. Known HTTP endpoint

### `GET /api/timetable/today`

Fetches classes for a specified teacher for the current day.

**Query parameters**

| Parameter | Required | Type | Description |
|---|---|---|---|
| `teacher_name` | Yes | String | Teacher name used to filter timetable entries. |
| `day` | No | String | Day override such as `MON`, `TUE`; documented behavior defaults to the actual system day. |

**Example request**

```http
GET /api/timetable/today?teacher_name=Dr.%20Ami%20Kumar%20Parida&day=THU
```

**Documented success response**

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

The example is illustrative. Confirm the actual response shape in the route/controller before relying on it in a client integration.

## 4. Endpoint groups to inventory

The product architecture implies the following API domains, but the route names and methods must be taken from actual backend route files. These are **inventory headings, not claims that all endpoints exist**.

| Domain | Expected responsibility | Verification |
|---|---|---|
| Authentication | Login, session/token validation, role identity | Inspect auth routes and middleware |
| Students | Student records, profile, dashboard, attendance history | Inspect student routes/controllers |
| Teachers | Teacher records and teacher-specific views | Inspect teacher routes/controllers |
| Subjects | Subject listing and administration | Inspect subject routes |
| Timetable | Daily timetable and schedule management | One GET endpoint documented above; inspect remaining routes |
| Attendance | Session creation, live records, review, confirmation | Inspect attendance routes and services |
| RFID | Card registration and event processing | Inspect MQTT consumer and any HTTP routes |
| Devices | Device registration, heartbeat, status | Inspect device routes and MQTT handlers |
| Camera | Enrollment, camera sessions, frame processing | Inspect Python routes and Node integration |
| Admin | Administrative operations | Inspect admin routes |

## 5. Internal MQTT integration

The original API document describes:

- Subscribe: `classroom/+/rfid`
- Publish: `classroom/+/status`

Example uplink:

```json
{
  "uid": "XX XX XX XX"
}
```

Example response:

```json
{
  "status": "success",
  "message": "Attendance marked"
}
```

**Warning:** These topics and payloads conflict with `mqtt-contract.md`, which specifies the `school/att/devices/{deviceId}/...` topic hierarchy. The inspected firmware uses MQTT and publishes configurable topics, but its example RFID payload differs from the richer contract. Do not treat both formats as simultaneously canonical. Verify `config.h`, backend MQTT subscriptions, and the broker configuration, then update both documents to match the protocol actually deployed.

## 6. Authentication and authorization

The supplied API reference does not specify:
- Token type or session mechanism.
- Authentication header format.
- Role middleware behavior.
- Refresh/logout behavior.
- Per-route authorization.

These details must be extracted from actual middleware and route implementation. Do not invent a Bearer-token contract or claim that all routes are protected without checking source.

## 7. Error handling and validation

The supplied API reference does not define a standard error envelope, validation schema, pagination convention, or rate-limit behavior. Document these only after inspecting the backend implementation.

Recommended items to record during the next API audit:

- HTTP status codes.
- Error response JSON.
- Zod or other request validation schemas.
- Authentication failure behavior.
- Not-found behavior.
- Duplicate RFID event handling.
- Database failure handling.
- Pagination and sorting parameters.

## 8. API verification checklist

- [ ] Enumerate all Express route registrations.
- [ ] Map each route to its controller and service.
- [ ] Record method, path, parameters, and response.
- [ ] Identify auth and role middleware.
- [ ] Confirm actual timetable response.
- [ ] Confirm camera service endpoints separately.
- [ ] Confirm MQTT topics and payloads against firmware.
- [ ] Test endpoints locally with valid and invalid inputs.
- [ ] Update this document after implementation changes.

## 9. Related documentation

- [Architecture](ARCHITECTURE.md)
- [Database schema](DATABASE_SCHEMA.md)
- [MQTT contract](mqtt-contract.md)
- [Attendance workflow](ATTENDANCE_WORKFLOW.md)
- [AI camera specification](AI_CAMERA_SPEC.md)
