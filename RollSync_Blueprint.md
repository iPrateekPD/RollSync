# RollSync — Intelligent Attendance & Presence Verification — Master Technical Blueprint
### RFID Check-In + BLE Dwell-Time Verification
Prepared for a 2-person student team (1 hardware, 1 software). Hardware is already purchased per the reference PDF and is treated as fixed.

**Legend used throughout:**
`[PDF]` = stated in the reference PDF · `[RESEARCH]` = drawn from external documentation/papers · `[RECOMMENDATION]` = my recommendation · `[ASSUMPTION]` = not specified by the PDF, assumed for design purposes.

---

## 1. Executive Summary

The PDF's core idea — RFID tap for check-in + BLE dwell-time for continuous verification — is a **sound and genuinely above-average concept** for a student project. It correctly identifies the real weakness of RFID-only systems (proxy tapping) and proposes a real fix (continuous presence, not a single event).

However, the PDF is a **hardware/BOM document**, not a software spec. It gives almost no detail on the backend, database, protocol design, security, or the BLE identity problem — and it glosses over the single biggest technical risk in the whole system: **reliably associating a specific BLE signal with a specific student using an unmodified smartphone.** That single issue determines whether this is a legitimate anti-proxy system or a system that quietly reduces to "RFID tap + hope."

My recommendation is **not to change the hardware**. It is to:
1. Treat "whose phone is this" as a solved problem only if you build a companion BLE-advertising app (or use dedicated keyfobs) — not raw phone Bluetooth discovery.
2. Build the RSSI dwell-time logic as a smoothed, confidence-based algorithm, not a raw threshold.
3. Build the entire software stack against a **hardware simulator** so you never wait on the hardware teammate.
4. Keep the architecture boring: MQTT + Node.js/Express + PostgreSQL + React + Socket.IO. No microservices, no Kubernetes, no NoSQL.

This document is organized so you can build directly from it, phase by phase.

---

## 2. Understanding the PDF

### What the PDF actually specifies
- **Hardware** `[PDF]`: ESP32-WROOM-32U, RC522 RFID reader + S50 cards/keyfobs, 128x64 I2C OLED, status LEDs + active buzzer, 5V/2A supply, breadboard/PCB, 3D-printed enclosure. Total cost ₹1,240–1,750 (~$15–21) per room node.
- **Concept** `[PDF]`: Layer 1 = RFID tap creates a session. Layer 2 = ESP32 BLE-scans for "the student's" signal; if RSSI ≥ −75 dBm cumulatively for ≥40 of a 50–60 min session (short gaps <5 min don't reset the counter), state becomes `VERIFIED_PRESENT` and is pushed to a cloud DB via Wi-Fi/MQTT or HTTP.
- **FSM** `[PDF]`: IDLE → CHECK_IN → MONITORING → VERIFIED, with EEPROM/Flash as local backup.
- **Suggested cloud stack** `[PDF]`: MQTT (Mosquitto/HiveMQ), Node-RED, React, PostgreSQL — offered as options, not a decision.

### What the PDF does *not* specify (and therefore leaves to you)
- How the ESP32 knows *which* BLE signal belongs to *which* student (no pairing/registration mechanism described).
- Any backend, API, authentication, or database design.
- What happens on network loss, duplicate events, unknown cards, or multiple ESP32s per building.
- MQTT topic structure, payload format, QoS, security (TLS/ACL/auth).
- What "RSSI ≥ −75 dBm" is measured against — one sample? An average? Over what window?
- Multi-classroom scaling, timezone/session scheduling, or how a "session" (50–60 min) is defined against a timetable.

Everything in that second list is genuinely your job as the software member, and is what this document builds out.

---

## 3. Requirements Extracted from the PDF

**A. System requirements**
- Detect physical entry via RFID tap.
- Continuously verify presence via BLE for the class duration.
- Reject "tap and leave" proxy attendance.
- Sync to a cloud database over Wi-Fi.
- Survive short network blips (implied by local Flash/EEPROM backup).

**B. Functional requirements**
- Read RFID UID and map to a known student.
- Create an attendance session at tap-in.
- Periodically scan and log BLE presence samples.
- Accumulate dwell time with break-tolerance logic.
- Transition to `VERIFIED_PRESENT` at 40 min cumulative.
- Push results to a server; show local feedback (OLED/LED/buzzer).

**C. Non-functional requirements** `[ASSUMPTION beyond PDF]`
- Real-time (or near-real-time) dashboard visibility for teachers.
- Data integrity — one authoritative attendance record per student per session.
- Reasonable security given the system touches student data (FERPA/DPDP-style sensitivity, even in a student project).
- Must run unattended for a full class, resilient to Wi-Fi flakiness typical of college buildings.
- Must be buildable and demoable by 2 students in a hackathon/semester timeframe.

**D. Hardware requirements** — fixed by PDF, listed in §2. Nothing here needs to change.

**E. Software requirements** (not in PDF, defined here) — backend API, MQTT broker, relational database, web dashboard (admin/teacher/student), device management, authentication.

**F. Communication requirements** — ESP32 ⇄ broker (MQTT, ideally TLS) or ESP32 ⇄ backend (HTTPS); backend ⇄ DB (SQL); backend ⇄ browser (REST + WebSocket).

**G. Attendance state machine** — expanded in §17; PDF's 4-state version is too thin for real failure handling.

**H. Data flow**
```
RFID tap  → ESP32 → MQTT/HTTP → Backend → students table lookup → attendance_sessions
BLE scan  → ESP32 → MQTT (batched) → Backend → dwell-time engine → attendance_sessions.cumulative_seconds
Backend   → PostgreSQL (durable store)
Backend   → WebSocket → React dashboard (live) 
Backend   → REST → React dashboard (history, reports)
```

**I. Assumptions the PDF makes** `[ASSUMPTION]`
1. That a smartphone's normal Bluetooth behavior gives a stable, identifiable, continuously-advertising signal — **this is the weakest assumption in the whole document** (see §11).
2. That "40 minutes of ≥ −75 dBm" is a fixed, universal calibration — in reality this varies per room (size, wall material, ESP32 antenna placement, furniture, room occupancy).
3. That one ESP32 per room is sufficient for BLE coverage — reasonable for a normal classroom, questionable for large lecture halls.
4. That Wi-Fi is available and stable — often untrue in older college buildings; the PDF gestures at this with local backup but doesn't design it.

**J. Weak / ambiguous / risky parts**
- No described mechanism for binding a BLE identity to a student (biggest gap).
- No definition of "a scan" — interval, sample count, filtering.
- No handling of unknown cards, duplicate taps, or tap-after-class-started.
- No security model at all — MQTT with no mention of auth/TLS is a real risk once this touches real student data.
- Single flat RSSI threshold ignores multipath, human-body attenuation, and neighboring-room bleed — the PDF itself acknowledges this by giving a *range* (−70 to −78 dBm) for calibration but doesn't define how you'd calibrate it.

**K. Parts that should remain exactly as specified**
- The two-layer concept (RFID + dwell-time) — keep it, it's the right idea.
- The hardware BOM — already bought, and it's adequate for this job.
- The general shape of the FSM (idle → check-in → monitor → verified) — keep as the philosophical skeleton, but expand states.
- 40-minute / 2400-second target and the "short break doesn't reset" idea — reasonable defaults, keep them as configurable parameters.

**L. Parts that should be redesigned in software**
- Replace "raw RSSI ≥ threshold" with a smoothed, confidence-scored presence algorithm (§12).
- Replace "no identity mechanism" with an explicit BLE identity strategy — a lightweight companion app that advertises a fixed rotating token, or keyfobs (§11).
- Add a real state machine with offline/expired/invalid states (§17).
- Add an actual offline-queue + replay design on the ESP32 (§14).
- Add MQTT security and a defined topic/payload schema (§9).

---

## 4. Research: Existing Technology & Prior Art

`[RESEARCH]` Summarized findings, technology by technology:

**RFID (RC522/MFRC522 + ESP32)** — This is a mature, extremely well-trodden combination; Espressif's own ESP-IDF and Arduino core both support SPI cleanly, and MFRC522 Arduino libraries are stable and widely used in student/hobby attendance projects. Maturity: very high. Difficulty for a 2-person team: low (hardware member already has this working). Verdict: use as-is.

**MQTT for IoT telemetry** — MQTT (via Mosquitto, HiveMQ, or EMQX) is the de facto standard for constrained-device telemetry: lightweight, publish/subscribe, supports QoS 0/1/2, retained messages, and Last Will and Testament (LWT) for detecting device dropout. It is a much better fit than plain HTTP for a device that needs to (a) announce it went offline and (b) receive lightweight commands. Maturity: very high, 20+ years the standard for IoT. Security is opt-in, not default — you must add TLS + auth + ACLs yourself; a bare Mosquitto install with anonymous access is a real, commonly-exploited misconfiguration. Difficulty for a 2-person team: low-to-moderate — Mosquitto is a single binary, trivial to run in Docker.

**ESP32 BLE scanning** — Espressif's Bluedroid/NimBLE stacks both expose active/passive scanning with per-advertisement RSSI. This part is solid and well documented. The uncertainty is not "can ESP32 scan BLE" (yes, easily) — it's "can it reliably identify one specific student's phone" (see §11).

**BLE RSSI indoor presence/localization research** — Published research is consistent and important for this design: RSSI in indoor environments is heavily affected by multipath fading, human-body attenuation, antenna orientation, and device heterogeneity, and raw RSSI is considered unreliable without smoothing. Studies applying Kalman filtering or multi-sample averaging to noisy RSSI streams report materially better stability than raw single-sample thresholds, and one propagation study found that explicitly modeling the effect of people's bodies in the room reduced positioning error from ~2 m down to ~0.6 m. The practical takeaway: **a single-sample −75 dBm cutoff will flap constantly**; smoothing is not optional polish, it's required for the system to work at all.

**Smartphone BLE advertising limits (iOS/Android)** — This is the crux of the whole project (detailed in §11). iOS in particular suspends apps in the background and does not reliably keep continuous BLE advertising/scanning alive; Apple's own Core Bluetooth documentation states that apps not declaring a background execution mode cannot discover or advertise BLE while suspended, and even apps that do declare background modes get throttled, delayed, and occasionally killed by the OS. Android is somewhat more permissive but has its own background-scanning throttling (since Android 7+) and requires location permission for BLE scanning. Conclusion: **you cannot rely on a stock, unmodified smartphone's Bluetooth radio behaving like a beacon.** You need either a small companion app using OS-sanctioned background BLE mechanisms (iOS CoreLocation beacon-region monitoring is the closest thing to reliable) or dedicated BLE hardware beacons/keyfobs.

**Anti-proxy / smart-attendance systems (academic + open-source)** — Numerous published systems combine RFID with a secondary signal (BLE, Wi-Fi, facial recognition, GPS) specifically to defeat proxy tapping; this validates the PDF's two-layer approach as a recognized pattern, not a novel gamble. Most production-grade or research prototypes that use BLE for this purpose use dedicated beacons or app-based advertising rather than assuming a "free-floating" phone signal is enough — reinforcing the identity-binding concern above.

**Backend/DB/Frontend maturity** — PostgreSQL, Node.js/Express, and React are all extremely mature, well-documented, boring-in-a-good-way choices with huge community support — appropriate for a 2-person team that needs to move fast and debug alone.

---

## 5. Software Architecture — Options and Recommendation

```
[ESP32] --(MQTT, TLS)--> [Mosquitto Broker] --(subscribe)--> [Backend MQTT Consumer]
                                                                     |
                                                              [Attendance Engine]
                                                                     |
                                                              [PostgreSQL]
                                                                /          \
                                                     [REST API]        [Socket.IO push]
                                                          |                   |
                                                   [React Dashboard] <--------
```

**Option comparison**

| Option | Description | Verdict |
|---|---|---|
| A. ESP32→MQTT→Backend→Postgres | Clean pub/sub, offline-friendly (LWT, retained status), decouples device from backend | **Recommended** |
| B. ESP32→HTTP REST→Backend→Postgres | Simpler mental model, no broker to run, but polling/reconnect logic is worse, no native offline detection, no fan-out if you add more consumers later | Backup option only |
| C. MQTT→Backend→Postgres→WebSocket frontend | Same as A plus explicit real-time layer | This **is** the recommendation, just spelled out fully |
| D. MQTT→Node-RED→DB→Dashboard | Node-RED is fast to prototype but becomes a maintenance/debugging nightmare for custom logic like the dwell-time state machine, and it's a second tool for a 2-person team to master | Not recommended |
| E. Hybrid MQTT + REST | MQTT for device telemetry, REST for browser/admin actions | **Recommended — this is what "the" architecture below actually is** |

**Recommendation: Option A/C/E combined** — MQTT for everything device-originated (it's naturally suited to lossy, always-on, small-payload telemetry and gives you LWT for free device-offline detection), REST for anything browser/admin-originated (CRUD, login, reports), and Socket.IO for pushing live state to the dashboard. This avoids Node-RED (one less tool to learn) and avoids raw HTTP-from-device (loses LWT/QoS benefits) without adding real complexity — it's a single Node.js process doing three jobs (MQTT consumer, REST server, Socket.IO server), not three separate services.

Why this wins for your context specifically:
- **2-person team**: one backend codebase, not a distributed system — one of you can understand all of it.
- **Reliability**: MQTT QoS 1 + broker persistence covers you if the backend briefly restarts.
- **Security**: TLS + username/password + per-device ACLs on Mosquitto is achievable in an afternoon.
- **Debuggability**: MQTT Explorer/mosquitto_sub lets you literally watch device traffic in real time — invaluable when the hardware teammate says "it's not working."
- **Real-time**: Socket.IO gives you live dashboard updates with reconnection handling built in.
- **Future expansion**: adding classrooms just means new device credentials + new topic namespace; nothing architectural changes.

---

## 6. Recommended Tech Stack

| Layer | Recommendation | Why (vs alternatives) |
|---|---|---|
| Frontend | **React** (Vite, not Next.js) | You don't need SSR/SEO for an internal dashboard; Vite+React is faster to iterate than Next.js for a 2-person team; plain HTML/JS would slow you down once you have 3 dashboards with shared state |
| Backend | **Node.js + Express** | One language across MQTT consumer, REST API, and WebSocket server; FastAPI/Django are fine languages but split your team's mental context across JS (frontend/firmware glue) and Python for no real benefit here; NestJS adds structure you don't need at this scale |
| Database | **PostgreSQL** | Relational integrity matters (attendance records, foreign keys to students/sessions); MongoDB buys you nothing here and loses you joins/constraints; SQLite is fine for local dev but not for a shared dashboard with concurrent writes |
| IoT protocol | **MQTT** | See §5 |
| MQTT broker | **Mosquitto** (self-hosted, Docker) | Free, lightweight, well documented, easiest to secure with TLS+ACL files for a small deployment; HiveMQ/EMQX are overkill (built for massive scale) |
| Real-time | **Socket.IO** | Automatic reconnection and fallback handling beats raw WebSockets for a small team; SSE is one-directional (fine for pure server→client, but Socket.IO gives you room-based broadcast per classroom "for free") |
| Authentication | **JWT** (access + refresh token), bcrypt for passwords | Stateless, easy to attach role claims (admin/teacher/student) for RBAC; session-based auth adds server-side session storage you don't need; OAuth is unnecessary complexity unless the college mandates SSO |
| Deployment | **Docker Compose** (backend + Postgres + Mosquitto) on **Railway or a cheap VPS** (or a spare laptop for the demo) | Docker Compose keeps "works on my machine" from becoming a demo-day disaster; Railway/Render have generous free tiers appropriate for a student project |
| ORM | **Prisma** | Type-safe queries, migrations built in, far less boilerplate than raw `pg`, easier than Sequelize for a small schema |
| Validation | **Zod** | Pairs naturally with Express + TypeScript |
| Language | **TypeScript** for backend and frontend | Given IoT payload shapes and a multi-role dashboard, catching shape mismatches at compile time is worth the small ramp-up cost for 2 people |
| Logging | **pino** (backend) | Fast, structured JSON logs — useful when debugging device/network issues after the fact |
| Secrets | `.env` + `dotenv`, never in firmware source | Firmware should get Wi-Fi/MQTT credentials via a config step, not hardcoded and pushed to a public GitHub repo |
| Testing | **Vitest/Jest** (backend), **Playwright** (E2E) | Standard, low-friction choices |

### RECOMMENDED STACK (summary)
```
Frontend:      React (Vite) + TypeScript + Tailwind
Backend:       Node.js + Express + TypeScript
Database:      PostgreSQL + Prisma ORM
IoT Protocol:  MQTT (TLS)
MQTT Broker:   Mosquitto (Docker)
Authentication:JWT (access+refresh) + bcrypt, RBAC (admin/teacher/student)
Realtime:      Socket.IO
Deployment:    Docker Compose → Railway/Render (or local VPS for demo)
Monitoring:    pino logs + simple health-check endpoint + MQTT LWT for device status
Testing:       Vitest (unit/integration) + Playwright (E2E)
```

---

## 7. Backend Design

**A. Folder structure**
```
backend/
  src/
    config/            # env loading, mqtt/db config
    modules/
      auth/            # controller, service, routes
      students/
      devices/
      classes/
      sessions/
      attendance/       # the engine lives here
      rfid/             # RFID event ingestion
      ble/              # BLE event ingestion + dwell logic
    mqtt/
      client.ts         # connects, subscribes
      handlers.ts        # routes topics to services
    realtime/
      socket.ts
    middleware/
      authGuard.ts
      roleGuard.ts
      errorHandler.ts
      validate.ts
    db/
      prisma/schema.prisma
      migrations/
    jobs/
      sessionTimeout.ts  # cron-like timers for session expiry
    utils/
    app.ts
    server.ts
  tests/
```

**B–E. Modules/controllers/services/DB layer** — each module follows controller → service → Prisma pattern. Controllers only parse/validate HTTP; services hold logic; Prisma is the only thing touching SQL.

**F. MQTT consumer** — a single long-lived client subscribed to `attendance/+/+/#` (see §9), dispatching by topic suffix to `rfid` or `ble` service handlers. Runs in the same process as Express (simplest option for 2 people) but as an isolated module so it could be split into its own process later without a rewrite.

**G. Attendance engine** — the core stateful logic (§12–13): consumes RFID/BLE events, updates `attendance_sessions`, runs the dwell-time smoothing algorithm, and emits state-change events to Socket.IO + persists to Postgres.

**H. Device management** — tracks device heartbeat, last-seen, online/offline (via MQTT LWT + heartbeat timestamp), exposed via `/api/devices`.

**I/J. Auth/Authz** — JWT with `role` claim; `roleGuard` middleware restricts routes (e.g., only `admin` can register devices, only `teacher`/`admin` can manually correct attendance).

**K. Logging** — pino, structured, one log line per MQTT message received and per state transition (essential for debugging flaky RSSI behavior after the fact).

**L/M. Error handling & validation** — centralized Express error handler; Zod schemas validate every MQTT payload before it touches the attendance engine (never trust device input).

**N. Background jobs** — a timer job that expires sessions after the scheduled class end + grace period, moving anyone still `MONITORING` to `INVALID`/`ABSENT`.

**O. WebSocket/event layer** — Socket.IO rooms per classroom (`classroom:{id}`); attendance engine emits `attendance:update` events; only clients subscribed to that classroom's room receive it (keeps payloads small, avoids leaking other classrooms' data to a given teacher's browser).

Keep this pragmatic — no dependency injection framework, no CQRS, no event sourcing. Controller→Service→Prisma, plus MQTT and Socket.IO glue, is enough.

---

## 8. Database Design (PostgreSQL)

### Minimum required schema (trimmed from the PDF's suggested list — merged/removed where unnecessary for an MVP)

```
students
---------
id              UUID PK
student_no      VARCHAR UNIQUE NOT NULL
name            VARCHAR NOT NULL
email           VARCHAR UNIQUE
rfid_uid        VARCHAR UNIQUE          -- one card per student (MVP simplification)
ble_token       VARCHAR UNIQUE          -- rotating/static token from companion app, or beacon MAC/UUID
created_at      TIMESTAMPTZ DEFAULT now()

users             -- admins & teachers (students may or may not need login; keep separate from students)
---------
id              UUID PK
email           VARCHAR UNIQUE NOT NULL
password_hash   VARCHAR NOT NULL
role            ENUM('admin','teacher') NOT NULL
created_at      TIMESTAMPTZ

classrooms
---------
id              UUID PK
name            VARCHAR NOT NULL
building        VARCHAR

devices                     -- ESP32 nodes
---------
id              UUID PK
device_uid      VARCHAR UNIQUE NOT NULL   -- MQTT client id
classroom_id    UUID FK -> classrooms
firmware_version VARCHAR
last_seen_at    TIMESTAMPTZ
status          ENUM('online','degraded','offline') DEFAULT 'offline'

courses
---------
id              UUID PK
name            VARCHAR NOT NULL
teacher_id      UUID FK -> users

class_sessions               -- a scheduled lecture slot
---------
id              UUID PK
course_id       UUID FK -> courses
classroom_id    UUID FK -> classrooms
scheduled_start TIMESTAMPTZ NOT NULL
scheduled_end   TIMESTAMPTZ NOT NULL
status          ENUM('scheduled','active','closed') DEFAULT 'scheduled'

attendance_sessions           -- one row per student per class_session (the FSM instance)
---------
id                  UUID PK
class_session_id    UUID FK -> class_sessions
student_id          UUID FK -> students
state               ENUM('IDLE','CHECK_IN','MONITORING','TEMP_ABSENT',
                          'VERIFIED_PRESENT','EXPIRED','INVALID','OFFLINE_PENDING')
checked_in_at        TIMESTAMPTZ
cumulative_seconds   INT DEFAULT 0
last_seen_ble_at     TIMESTAMPTZ
finalized_at         TIMESTAMPTZ
UNIQUE (class_session_id, student_id)

rfid_events                  -- raw ingestion log (append-only, for audit + dedup)
---------
id              UUID PK
device_id       UUID FK -> devices
event_id        VARCHAR UNIQUE NOT NULL   -- device-generated idempotency key
rfid_uid        VARCHAR NOT NULL
received_at     TIMESTAMPTZ DEFAULT now()
processed       BOOLEAN DEFAULT false

ble_presence_events          -- raw ingestion log (can be pruned/aggregated after processing)
---------
id              UUID PK
device_id       UUID FK -> devices
attendance_session_id UUID FK -> attendance_sessions NULL
ble_token       VARCHAR NOT NULL
rssi            SMALLINT NOT NULL
sampled_at      TIMESTAMPTZ NOT NULL
received_at     TIMESTAMPTZ DEFAULT now()

audit_logs
---------
id              UUID PK
actor_user_id   UUID FK -> users NULL
action          VARCHAR NOT NULL         -- e.g. 'manual_attendance_correction'
target_table    VARCHAR
target_id       UUID
details         JSONB
created_at      TIMESTAMPTZ DEFAULT now()
```

**Why each table exists:** `students`/`users` separate identity from login (not every student necessarily needs a portal login for MVP). `devices` is required for heartbeat/health tracking (§21). `class_sessions` is required so "40 minutes of a 50–60 min session" has an actual session to measure against — the PDF never defines this, but without it there is no way to know when a session starts/ends. `attendance_sessions` is the single source of truth for the FSM per student per lecture. `rfid_events`/`ble_presence_events` are raw/append-only so you can debug, deduplicate (via `event_id`), and re-run the dwell-time algorithm later without re-reading hardware. `audit_logs` covers the PDF's implicit need for accountability on manual corrections.

**Explicitly dropped from the PDF's suggested table list for MVP**: separate `rfid_cards`/`ble_devices` tables (merged into `students` as MVP — one card/token per student is enough to start; split out later if you support multiple devices per student), and a standalone `dwell_time_records` table (dwell time is a running counter on `attendance_sessions`; the raw samples in `ble_presence_events` already give you full history if you need to recompute).

**Indexes/constraints**: unique index on `rfid_uid`, `ble_token`, `event_id`; composite unique on `(class_session_id, student_id)`; index on `ble_presence_events(attendance_session_id, sampled_at)` for fast dwell-time recomputation; foreign keys with `ON DELETE RESTRICT` for anything historical (never cascade-delete attendance history).

---

## 9. MQTT Architecture

**Topic hierarchy** `[RECOMMENDATION]`
```
attendance/{classroomId}/{deviceId}/rfid        -- QoS 1, not retained
attendance/{classroomId}/{deviceId}/ble         -- QoS 0 (high-frequency, loss-tolerant), not retained
attendance/{classroomId}/{deviceId}/status      -- QoS 1, RETAINED (last known state)
attendance/{classroomId}/{deviceId}/heartbeat   -- QoS 0, not retained
attendance/{classroomId}/{deviceId}/ack         -- backend → device, QoS 1
```
Nesting by classroom first makes broker ACLs natural (a device only needs pub/sub rights under its own classroom path).

**QoS choice**: RFID events are rare and important → QoS 1 (at-least-once, dedupe by `eventId` server-side). BLE samples are frequent and individually low-value → QoS 0 is fine since the dwell-time algorithm is designed to tolerate missed samples anyway (§12). Status/LWT → QoS 1 + retained so a newly-connecting dashboard immediately knows current device state.

**Persistent sessions / clean session**: ESP32 should connect with `clean_session=false` and a stable client ID so any QoS-1 messages queued while briefly disconnected are delivered on reconnect (bounded by broker's max queued messages).

**Last Will and Testament**: each device sets an LWT publishing `{"status":"offline"}` to its `status` topic — this is how the dashboard shows 🔴 without waiting for a heartbeat timeout.

**Payload structure** `[PDF gave a sample]` — refined:
```json
// rfid topic
{
  "eventId": "esp32-04-1725500000-1",
  "deviceId": "esp32-04",
  "rfidUid": "A1B2C3D4",
  "timestamp": "2026-09-05T09:03:12Z"
}
```
```json
// ble topic (batched, not one message per sample — reduces traffic)
{
  "deviceId": "esp32-04",
  "batchStart": "2026-09-05T09:10:00Z",
  "samples": [
    {"bleToken": "tok_9f21", "rssi": -68, "ts": "2026-09-05T09:10:00Z"},
    {"bleToken": "tok_9f21", "rssi": -71, "ts": "2026-09-05T09:10:10Z"}
  ]
}
```

**On sensitive identifiers** `[RECOMMENDATION — critical]`: The PDF's example payload includes a raw `studentId`. **Don't transmit a real student ID or roll number over MQTT.** Use an opaque `rfidUid` (the card's hardware UID — meaningless without your DB) and an opaque, rotating `bleToken` from the companion app rather than a phone MAC address or a human-readable identifier. The backend — the only place that has both the mapping table and access control — resolves `rfidUid`/`bleToken` → student identity. This limits the blast radius if MQTT traffic is ever sniffed (e.g., misconfigured broker, or someone running a BLE/MQTT sniffer near the classroom).

**Security**: TLS on the broker listener (self-signed cert is fine for a student deployment, but *use TLS*, not plaintext); username/password per device; Mosquitto ACL file restricting each device to publish/subscribe only under its own `attendance/{classroomId}/{deviceId}/#` path; backend connects with its own broader-scoped credentials. This is achievable in an afternoon and is far better than the PDF's silence on the topic.

**Duplicates/offline messages/reconnect**: handled at two levels — MQTT QoS1+persistent session for transport-level redelivery, and `eventId` uniqueness constraint in `rfid_events` for application-level dedup (insert with `ON CONFLICT DO NOTHING`).

---

## 10. RFID Flow

```
Tap → RC522 reads UID → ESP32 debounces (ignore same UID within 3s)
   → generate eventId (deviceId + monotonic counter or timestamp)
   → publish to rfid topic (QoS1, queued if offline)
   → backend: validate UID against students table
        - unknown UID → reject, log to rfid_events unprocessed, OLED shows "Card not recognized"
        - known UID, no active class_session for this classroom right now → reject with "No active class", still logged for audit
        - known UID, active session exists, no attendance_session row yet → create one, state=CHECK_IN→MONITORING
        - known UID, attendance_session already exists and MONITORING/VERIFIED → duplicate tap, ignore silently (idempotent), OLED shows "Already checked in"
        - tap arrives after class start → still accept, but cumulative_seconds target may be prorated (design choice — see §32 future improvements) or simply requires the full 40 min from that point, whichever policy you choose; recommend requiring the full 40 minutes to keep the anti-proxy guarantee simple
   → backend publishes ack to device's ack topic; ESP32 shows result on OLED + green/red LED + buzzer
```

**Failure cases**
- **Wi-Fi down at tap time**: ESP32 queues the RFID event in NVS/LittleFS (see §14), shows "Saved offline" on OLED, replays on reconnect.
- **MQTT broker down**: same as above — event queues locally regardless of which transport layer failed.
- **Backend unavailable but broker up**: MQTT persistent session queues the message on the broker side until backend reconnects and re-subscribes.
- **Duplicate messages** (retries, reconnect replay): deduplicated by `eventId` unique constraint at the DB layer — cheap and robust.

---

## 11. BLE Presence Flow — The Central Technical Question

`[RESEARCH]` Background:
- BLE peripherals advertise packets containing (typically) a device address, optional service UUIDs, and optional manufacturer data; RSSI is measured per received advertisement by the scanner (ESP32).
- Modern smartphones use **randomized/private MAC addresses** that rotate periodically (both iOS and Android) specifically to prevent third-party tracking — meaning **you cannot reliably identify a phone by its Bluetooth MAC address** over any meaningful duration.
- **iOS background limitations**: Apple's Core Bluetooth documentation is explicit that apps not declaring a background execution mode cannot advertise or scan while suspended; even apps that do request `bluetooth-central`/`bluetooth-peripheral` background modes are throttled (advertising intervals slow down, local name is dropped from background adverts, and the OS can still kill the app for resource pressure). Multiple developer reports confirm apps have been killed mid-session in real-world background BLE use.
- **Android limitations**: background BLE scanning is throttled since Android 7+, and both scanning and (in many OEM skins) background activity are subject to aggressive battery-optimization killing unless the user explicitly whitelists the app.
- Net effect: **"the ESP32 continuously detects the student's smartphone BLE signal" is not a safe assumption for a stock, unmodified phone with no companion app, especially on iOS.**

`[RESEARCH]` RSSI-as-presence is also inherently noisy: indoor RSSI is affected by multipath fading, human-body attenuation (a person's own body between the phone and the ESP32 antenna measurably changes RSSI), device antenna differences, and neighboring-room signal bleed through walls. Academic evaluations of RSSI-based indoor positioning consistently report the raw metric as unreliable without filtering (Kalman filtering, multi-sample averaging) — one museum-scale deployment used exactly this two-layer combination (raw RSSI + Kalman smoothing) to get usable proximity zones with fluctuating readings.

### Option comparison

| Option | Reliability | Cost | Difficulty | Privacy | Battery | Spoofing resistance | Scalability |
|---|---|---|---|---|---|---|---|
| A. Stock phone BLE (no app) | **Low** — MAC randomization + background suspension breaks continuity | Free | N/A — doesn't actually work reliably | Good (nothing to leak) but useless | N/A | Very low (anyone's idle phone might momentarily appear) | N/A |
| B. Dedicated BLE keyfob | High | ~₹250–350/student, already priced in PDF as an option | Low (no app needed) | Good (no personal data on device) | Excellent (months on coin cell) | Moderate (can be lent to a friend — same problem as RFID cards) | Good |
| C. Student smartphone + companion app (foreground-tolerant, uses OS beacon-region APIs) | Medium-High if built correctly (iOS CoreLocation beacon monitoring; Android foreground service) | Free (dev time only) | Moderate-High (real app engineering, especially iOS) | Needs care — rotate the advertised token, don't broadcast student ID | Moderate | Same "lend your phone" risk as B, plus phone must be carried | Good once built |
| D. Wi-Fi presence (device connects to classroom AP) | Medium | Free (uses existing infra) | Low-Moderate | Needs care (MAC randomization affects this too, less severely) | None | Low-moderate | Good |
| E. RFID + periodic re-tap (no BLE at all) | Medium (defeats "tap and leave" only if re-taps are frequent enough to be inconvenient to fake) | Free | Very low | Good | N/A | Moderate | Excellent |
| F. QR code fallback (rotating QR shown in room, scanned periodically) | Medium | Free | Low | Good | Low | Low (photo of QR can be shared) | Good |
| G. Hybrid (RFID tap-in + keyfob/app dwell-time + periodic re-tap as backstop) | **Highest** | Uses what's already bought + optional keyfob | Moderate | Good with opaque tokens | Good | Best of the set | Good |

### `[RECOMMENDATION]`
**Do not rely on raw phone BLE discovery.** Given the hardware is already bought and you shouldn't change it, the smallest modification that meaningfully fixes reliability is:

**Build a lightweight companion mobile app whose only job is to advertise a fixed, opaque BLE token** (registered once per student, rotated periodically for privacy) as a **foreground/near-foreground activity during class**, *or* — if app development time is too tight — **fall back to the dedicated BLE keyfobs the PDF already priced in** (₹250–350/student). The keyfob path removes the entire iOS-background-suspension problem because a keyfob has no OS to suspend it.

If you do build the app: on iOS, use CoreLocation beacon-region monitoring (the one mechanism Apple actually wakes suspended apps for on beacon proximity) rather than raw Core Bluetooth background scanning, since Apple's documentation and multiple independent reports agree plain background BLE is not reliable enough on its own.

Either way, **add option E (a mid-session re-tap) as a cheap backstop**: require one additional RFID tap at a random point in the 50–60 min window (announced to nobody in advance) as a secondary signal even if BLE dwell-time is being tracked. This adds real anti-proxy strength using hardware you already have, with zero new engineering risk, and directly answers the "what if BLE totally fails" case.

---

## 12. RSSI / Dwell-Time Algorithm

`[PDF]` proposed: sample periodically, if RSSI ≥ −75 dBm add 10s, short breaks <5 min pause without resetting.

`[RESEARCH]` Why raw threshold-on-single-sample is wrong: indoor RSSI readings fluctuate by 10–20+ dBm from multipath and body attenuation even when the device hasn't moved; a single bad sample would incorrectly flip presence state constantly.

### `[RECOMMENDATION]` Designed algorithm

**Parameters** (make these configurable, not hardcoded):
- `SAMPLE_INTERVAL` = 10s (ESP32 BLE scan tick)
- `WINDOW_SIZE` = 3 samples (30s) moving average
- `RSSI_THRESHOLD` = −75 dBm (calibrated per room, see below)
- `HYSTERESIS_MARGIN` = 4 dBm (enter presence at ≥ −75, exit only below −79 — prevents flapping right at the boundary)
- `CONFIDENCE_UP_STEP` / `CONFIDENCE_DOWN_STEP` — confidence increments/decrements per sample rather than a binary in/out
- `MIN_CONSECUTIVE_FOR_PRESENT` = 2 windows above threshold before counting toward dwell time (avoids single-fluke credit)
- `MISSED_SCAN_GRACE` = counts as neutral (no penalty), not automatic absence — BLE scans can legitimately miss a beacon for a cycle
- `SHORT_BREAK_TOLERANCE` = 5 min (per PDF) — below threshold but pauses rather than resets
- `LONG_ABSENCE_RESET` = if below threshold continuously for > `SHORT_BREAK_TOLERANCE`, pause accumulation (don't reset to zero — being generous is safer for false negatives, since the anti-cheat backstop is the mid-session re-tap, not zero-tolerance dwell counting)

**Pseudocode**
```
state.confidence = 0        // 0-100
state.presence = false
state.cumulative_seconds = 0
state.last_above_threshold_at = null

on each BLE sample batch (per device, per student token):
    smoothed_rssi = movingAverage(last WINDOW_SIZE samples)

    if smoothed_rssi >= RSSI_THRESHOLD (or >= RSSI_THRESHOLD - HYSTERESIS_MARGIN if already present):
        state.confidence = min(100, state.confidence + CONFIDENCE_UP_STEP)
    else:
        state.confidence = max(0, state.confidence - CONFIDENCE_DOWN_STEP)

    was_present = state.presence
    state.presence = state.confidence >= CONFIDENCE_ENTER_THRESHOLD 
                      if not was_present else 
                      state.confidence >= CONFIDENCE_EXIT_THRESHOLD  // hysteresis on confidence too

    if state.presence:
        state.cumulative_seconds += SAMPLE_INTERVAL
        state.last_above_threshold_at = now()
    else:
        gap = now() - state.last_above_threshold_at
        if gap > SHORT_BREAK_TOLERANCE:
            // pause only — do not decrement cumulative_seconds
            mark_state("TEMPORARILY_ABSENT")

    if state.cumulative_seconds >= REQUIRED_DWELL_SECONDS (2400):
        transition_to("VERIFIED_PRESENT")
```

**Missed scans** are treated neutrally (neither help nor hurt) rather than as automatic penalties, because Wi-Fi/BLE scan gaps are normal and shouldn't punish a genuinely present student.

**Room calibration**: before relying on the −75 dBm default, walk the room with the actual keyfob/phone at the door, center, and back corner, log RSSI at each position over a couple minutes, and set `RSSI_THRESHOLD` to a value that includes "back corner" but excludes "just outside the door" — this is a one-time, per-room manual calibration step, not something you can skip.

---

## 13. Attendance State Machine

```
        RFID tap (known card, active session)
IDLE ───────────────────────────────► CHECK_IN
                                          │  BLE monitoring begins
                                          ▼
                                     MONITORING ◄────────────┐
                                     │      │                │
                     confidence drops│      │ RSSI regain    │ short break
                     below threshold │      │ within 5 min   │ (<5min)
                                     ▼      └────────────────┘
                            TEMPORARILY_ABSENT
                                     │
                     absence > 5 min but session still active
                                     ▼
                                 MONITORING (resumes, no reset — dwell counter untouched)
                                     
MONITORING ──cumulative ≥ 2400s──────► VERIFIED_PRESENT (terminal, success)
MONITORING ──session end, dwell < 2400s──► INVALID (terminal, proxy-tap suspected)
IDLE       ──session end, no tap ever──► absent by default (no row created, or EXPIRED if pre-created)
Any state  ──device offline entire time──► OFFLINE_PENDING (awaiting replayed data on reconnect)
OFFLINE_PENDING ──device reconnects, backfilled data sufficient──► re-evaluate to VERIFIED_PRESENT/INVALID
```

| State | Meaning | Entry | Exit | Timeout | DB action | ESP32 action |
|---|---|---|---|---|---|---|
| IDLE | No session yet | class scheduled, no tap | RFID tap | none | none | display "Tap card" |
| CHECK_IN | Tap just registered | valid RFID event | immediately → MONITORING | n/a | insert attendance_session | green LED + short beep |
| MONITORING | Actively accumulating dwell time | after CHECK_IN | dwell target hit, or session ends, or presence lost >5min | class end time | update cumulative_seconds | OLED shows live minutes |
| TEMPORARILY_ABSENT | Presence lost but within grace window | confidence drop | presence regained, or grace exceeded | 5 min | no dwell decrement | OLED shows "signal lost" |
| VERIFIED_PRESENT | Anti-proxy criteria met | dwell ≥ 2400s | terminal | n/a | finalize record, push to dashboard | green confirmation |
| INVALID | Tapped but never reached dwell threshold | session ends, dwell < target | terminal | n/a | finalize as invalid/absent | none (post-hoc) |
| EXPIRED | Session's scheduled window passed with no tap at all | session end job | terminal | n/a | mark absent | none |
| OFFLINE_PENDING | Device was offline during part/all of session | device disconnect detected mid-session | device reconnects and backend reprocesses buffered events | bounded by NVS buffer size | held pending | store queued events locally |

---

## 14. Offline-First / Failure Handling

`[RESEARCH]` ESP32 storage options: **NVS (Preferences)** is a simple key-value flash store good for small config/state but not ideal for a growing event queue; **SPIFFS** is the older ESP32 filesystem, largely superseded; **LittleFS** is the modern recommended choice (better wear-leveling, crash resilience, actively maintained in the Arduino/ESP32 core) for anything resembling a file-based queue; an SD card is unnecessary at this event volume.

**`[RECOMMENDATION]`**: use **LittleFS** as a small append-only JSON-lines queue file (`/queue.jsonl`) for RFID + BLE-batch events generated while offline, capped at a sane size (e.g., 500 events — a full class session's worth), overwriting oldest if exceeded, since attendance for a fully-offline session degrades gracefully to "recorded once reconnected" rather than "lost forever."

**Flow**
```
Local queue (LittleFS) → on Wi-Fi/MQTT reconnect → replay in order (oldest first)
     → backend dedups by eventId → applies to attendance_sessions retroactively
     → ack sent back per event → device deletes acked entries from queue
```

**Specific failure cases**
- **Wi-Fi loss**: events queue locally; OLED shows an offline indicator; RFID taps still get local audio/visual feedback (you can validate the UID format locally even without server confirmation, and reconcile identity server-side later).
- **MQTT broker down but Wi-Fi up**: ESP32's MQTT client retries connection on an exponential backoff; events queue the same way.
- **Backend down but broker up**: broker's persistent session (QoS1, `clean_session=false`) holds messages; no ESP32-side change needed.
- **Power/ESP32 reboot**: LittleFS queue survives reboot; on boot, ESP32 attempts to flush the queue before resuming normal scanning.
- **BLE data collected while offline**: buffered exactly like RFID events, replayed as a batch; the dwell-time algorithm in §12 operates the same whether it receives samples live or in a backfilled burst (it's driven by sample timestamps, not wall-clock arrival time).

---

## 15. Security Analysis

`[RECOMMENDATION]` — practical, not over-engineered, for a system that touches real student data:

- **MQTT**: TLS on the broker; per-device username/password; Mosquitto ACL file scoping each device to its own topic subtree (§9). This alone eliminates the most common real-world MQTT attack (public/misconfigured broker discovered via Shodan-style scanning).
- **API auth**: JWT access tokens (short-lived, e.g. 15 min) + refresh tokens (longer-lived, stored httpOnly cookie); RBAC middleware on every route.
- **SQL injection**: neutralized by using Prisma (parameterized queries) — never string-concatenate SQL.
- **XSS**: React escapes by default; still sanitize any user-supplied text rendered as HTML (e.g., a "correction reason" field) and set a basic CSP header.
- **CSRF**: low risk with JWT-in-header for API calls; if you use cookies for refresh tokens, use `SameSite=Strict`.
- **Replay/duplicate injection**: `eventId` uniqueness + timestamp sanity check (reject events with timestamps far in the future/past) covers the realistic threat level here.
- **RFID UID spoofing/cloning**: MFRC522 cards are not cryptographically strong (UID-only reads are clonable with cheap hardware) — acceptable risk for a student project; call this out explicitly as a known limitation rather than pretending it's solved.
- **BLE spoofing**: an attacker with the token value could impersonate it; mitigate by rotating tokens periodically and never printing/logging them anywhere a student could screenshot easily — but accept this isn't cryptographically bulletproof either.
- **Fake ESP32 devices**: broker ACLs + per-device credentials prevent an arbitrary device from publishing under another classroom's topic; a truly malicious actor with valid device credentials is out of scope for a student project's threat model.
- **Rate limiting / input validation**: basic `express-rate-limit` on auth endpoints; Zod validation on every MQTT payload and REST body before it reaches the DB.
- **Secrets in firmware**: Wi-Fi/MQTT credentials should be provisioned at flash-time (build flag or a config partition), never committed to the firmware repo in plaintext.
- **Audit logs**: every manual attendance correction writes to `audit_logs` with actor, timestamp, before/after — this is cheap to build and important for trust in the system.

---

## 16. Anti-Cheating / Anti-Spoofing Analysis

| Attack | Vulnerability | Difficulty for attacker | Mitigation | Fully preventable? |
|---|---|---|---|---|
| Give RFID card to a friend | Card ≠ person | Trivial | Mid-session re-tap backstop (§11) makes this require a second favor, and BLE dwell-time still requires the actual token/beacon to be present | No — inherent to any card-based system |
| Leave phone/keyfob in room | Token present, student absent | Trivial | None fully solves this without biometrics; combine with the re-tap requirement and random spot-checks by the teacher | No |
| Clone RFID UID | MFRC522 UID-only reads are clonable | Moderate (needs proxmark-class hardware) | Out of scope to fully prevent with this hardware; acceptable for student-project threat model | No |
| Spoof BLE token | If token value leaks | Moderate | Rotate tokens, don't log/display raw tokens, treat as best-effort not cryptographic proof | No |
| Stand near door / in hallway | RSSI bleed | Real, PDF acknowledges it | Threshold calibration (§12) + hysteresis; physically, thick classroom walls help | Partially |
| Neighboring classroom signal | Same root cause as above | Real | Per-room calibration; consider directional antenna placement away from shared walls | Partially |
| Turn Bluetooth off | No BLE signal at all | Trivial | Dwell time simply never accumulates → student correctly marked INVALID; this is the system working as intended, not a bypass | Yes (system correctly fails them) |
| Change phone/device without re-registering | Old token invalid | N/A (self-defeating for the cheater) | Re-registration flow required, no exploit here | Yes |
| ESP32 sends fake attendance event | Requires valid device credentials | Low (once you're a legitimate operator) | Out of scope — trusting your own installed hardware is a reasonable assumption for this threat model | Not a realistic attack |

**Honest framing for your report**: this system meaningfully raises the cost and inconvenience of proxy attendance (a single RFID tap is no longer sufficient) but does **not** make it cryptographically impossible — no RFID+BLE system at this price point can. The mid-session re-tap is the single cheapest addition that most directly attacks the "leave token behind" failure mode.

---

## 17. API Design (selected endpoints — full spec should live in an OpenAPI file in the repo)

| Method & Path | Auth | Role | Body | Response | Notes |
|---|---|---|---|---|---|
| POST /api/auth/login | none | — | `{email,password}` | `{accessToken, refreshToken, role}` | |
| POST /api/devices/register | JWT | admin | `{deviceUid, classroomId}` | device record + generated MQTT credentials | one-time provisioning |
| GET /api/devices | JWT | admin/teacher | — | list with `status`, `lastSeen` | drives §21 dashboard |
| POST /api/courses | JWT | admin | `{name, teacherId}` | course record | |
| POST /api/sessions | JWT | admin/teacher | `{courseId, classroomId, scheduledStart, scheduledEnd}` | class_session record | |
| POST /api/sessions/:id/close | JWT | teacher/system job | — | finalizes all attendance_sessions in that class_session | also triggered automatically by the timeout job (§7-N) |
| GET /api/attendance/live?classroomId= | JWT | teacher/admin | — | current attendance_sessions + states | polled or replaced by socket subscription |
| GET /api/students/:id/attendance | JWT | student(self)/teacher/admin | — | history + percentage | |
| POST /api/attendance/:id/correct | JWT | teacher/admin | `{newState, reason}` | updated record | writes to audit_logs |
| POST /api/rfid/simulate (dev only) | JWT | admin | fake RFID payload | — | feeds the same pipeline as real MQTT, for testing without hardware |

(RFID/BLE ingestion itself happens via MQTT, not REST — see §9; REST is for browser/admin actions only, per the hybrid architecture in §5.)

---

## 18. Frontend Architecture

```
frontend/src/
  pages/
    Login.tsx
    AdminDashboard.tsx
    TeacherDashboard.tsx
    StudentDashboard.tsx
    LiveClassroomView.tsx
  components/
    AttendanceCard.tsx
    DeviceHealthBadge.tsx
    DwellTimeBar.tsx
    AttendanceTable.tsx
  api/            # thin fetch wrappers per resource
  hooks/
    useSocket.ts   # Socket.IO connection + room subscription
    useAuth.ts
  state/          # lightweight (Zustand or React Context) — no Redux needed at this scale
  routes/
    ProtectedRoute.tsx  # role-based route guard
```
Live classroom view subscribes to `classroom:{id}` socket room; falls back to a 5s poll of `GET /api/attendance/live` if the socket disconnects, so the UI degrades gracefully rather than freezing.

---

## 19. Real-Time Dashboard

**Comparison**: Polling is simplest but wastes requests and adds latency; raw WebSockets require you to hand-roll reconnection; SSE is one-directional and fine but Socket.IO's room-based broadcast maps naturally onto "one room per classroom" with reconnection handled for you.

**Recommendation**: **Socket.IO**, with REST polling as an automatic fallback (already reflected in §18).

**Flow**: `ESP32 → MQTT → Backend MQTT consumer → Attendance Engine → Postgres write → Socket.IO emit to classroom:{id} room → React dashboard updates instantly`.

---

## 20. ESP32 Device Management

Heartbeat payload (every 30s):
```json
{"deviceId":"esp32-04","uptimeSec":18320,"freeHeap":142000,"wifiRssi":-52,"firmware":"1.2.0"}
```
Status derivation:
- 🟢 **Online**: heartbeat received within last 60s and MQTT connected.
- 🟡 **Degraded**: heartbeat late (60–180s) or low free heap/high error rate reported.
- 🔴 **Offline**: LWT fired, or no heartbeat for >180s.

---

## 21. Hardware Simulator (build this first, in parallel with hardware assembly)

`[RECOMMENDATION — this is the key to not blocking on your teammate]`

Build a small Node.js/Python script (`/tools/simulator`) that connects to the **same Mosquitto broker** with a fake device ID and publishes the **exact same topic/payload shapes** the real ESP32 will use:

```
simulator → mqtt://broker (attendance/{classroomId}/sim-esp32/rfid, /ble, /heartbeat, /status)
```

Scriptable scenarios: `simulateTap(studentToken)`, `simulateDwell(studentToken, minutes, avgRssi, jitter)`, `simulateShortBreak()`, `simulateLongAbsence()`, `simulateWifiOutage(durationSec)` (just stop publishing, then burst-replay queued events to mimic the real reconnect/replay behavior), `simulateDuplicateEvent()`, `simulateReboot()`.

Because the backend only ever sees MQTT messages — it has no idea whether they came from a simulator script or a real ESP32 — you can build and demo the **entire backend, database, and frontend** before the hardware is even fully assembled. When the real ESP32 firmware is ready, you just point it at the same broker with the same topic convention and swap it in with zero backend changes.

---

## 22. Testing Strategy (representative cases)

| Test | Expected |
|---|---|
| RFID tap + stay 42 min above threshold | CHECK_IN → MONITORING → VERIFIED_PRESENT |
| RFID tap + immediate exit | dwell stays ~0 → INVALID at session end |
| RFID tap + BLE token never detected | same as above |
| Wi-Fi outage 5 min mid-session | events queue locally, replay on reconnect, dwell time computed correctly from timestamps |
| MQTT broker outage | broker persistent session buffers backend-bound messages; no data loss on reconnect |
| ESP32 reboot mid-session | LittleFS queue survives; resumes cleanly |
| Duplicate RFID event (retry) | deduped by `eventId`, no double session created |
| Unknown RFID card | rejected, logged, OLED shows "not recognized" |
| Short 3-minute break | dwell time pauses, resumes, no reset |
| 10-minute absence | dwell time pauses at that point; if reconnection doesn't happen before session end, finalizes based on accumulated total |
| Neighbor-classroom BLE bleed | with correct hysteresis/threshold calibration, should not falsely accumulate dwell time — explicitly test at a shared wall |
| Late arrival (tap at 20 min mark) | CHECK_IN still accepted; dwell target still 40 min from that point (policy choice, documented) |
| Load test | simulate 60 students' worth of BLE batches per classroom per 10s tick across 5 simulated classrooms — confirm backend and DB handle sustained write rate |

---

## 23. Implementation Roadmap

| Phase | Objective | Can run parallel to hardware work? |
|---|---|---|
| 0. Architecture | Finalize this document, lock topic/schema conventions | Yes |
| 1. Database | Postgres schema + Prisma migrations | Yes |
| 2. Backend skeleton | Express app, auth, health check | Yes |
| 3. MQTT | Mosquitto in Docker, TLS, ACLs | Yes |
| 4. Simulator | Build hardware simulator (§21) | Yes — do this early |
| 5. Attendance engine | FSM + dwell-time algorithm against simulator | Yes |
| 6. RFID flow | Full ingestion pipeline, tested via simulator | Yes |
| 7. BLE flow | Full ingestion + smoothing, tested via simulator | Yes |
| 8. Frontend | Dashboards, auth, protected routes | Yes |
| 9. Real-time | Socket.IO wiring | Yes |
| 10. Security hardening | TLS, RBAC, rate limiting, audit logs | Yes |
| 11. Real ESP32 integration | Swap simulator for real firmware, same broker/topics | **Now** requires hardware done |
| 12. Field calibration | Walk-test RSSI thresholds in the actual room | Requires hardware + room access |
| 13. Testing | Run the full test matrix (§22) against real hardware | Requires hardware |
| 14. Deployment & demo prep | Docker Compose up on VPS/Railway, rehearse demo | Final week |

Notice phases 0–10 need **zero physical hardware** — this is the entire point of the simulator strategy.

---

## 24–27. Repo Structure, Dev Tools, Dev Order (condensed)

```
/frontend  /backend  /firmware  /docs  /docker  /tests  /tools/simulator
```
**Minimum dev tools**: Node.js + npm, Docker, Git, VS Code, Postman/Insomnia (API testing), MQTT Explorer (watching device traffic), PlatformIO or Arduino IDE (firmware — your teammate's tool, not yours). Skip ESP-IDF unless your teammate specifically needs low-level control.

**Development order** (answering §26/27 directly): **1. DB schema → 2. Backend skeleton+auth → 3. Mosquitto in Docker → 4. Simulator → 5. Attendance engine against simulator → 6. REST API → 7. Frontend against mocked/simulated data → 8. Socket.IO → 9. Security hardening → 10. Swap in real ESP32 → 11. Field calibration → 12. Full test pass → 13. Deploy.** This order guarantees you (software) are never blocked waiting on your teammate.

---

## 28. Final System Architecture

```
[Student RFID card]          [Student phone (companion app) or BLE keyfob]
        │                                   │
        ▼                                   ▼
     [RC522] ──────────────────────►   [ESP32 BLE scanner]
                        │
                        ▼
              [ESP32 debounce + local queue (LittleFS)]
                        │  MQTT (TLS, QoS1/0 per topic)
                        ▼
                [Mosquitto Broker]
                        │
                        ▼
        [Backend: MQTT consumer + Attendance Engine]
              │                        │
              ▼                        ▼
        [PostgreSQL]            [Socket.IO emit]
              │                        │
              ▼                        ▼
        [REST API]  ─────────►  [React Dashboard]
```
This differs from the PDF's implied architecture mainly by adding: TLS/ACL security, an explicit identity-binding mechanism for BLE (app token or keyfob, not raw phone MAC), a smoothing/confidence layer on RSSI, and the offline queue/replay design.

---

## 29. Scalability

| Classrooms | ESP32 nodes | MQTT msgs/min (approx, 1 BLE batch/10s + occasional RFID) | DB growth | Backend/broker needs |
|---|---|---|---|---|
| 1 | 1 | ~6-10 | Negligible | Single small VM/container |
| 5 | 5 | ~30-50 | Small (MBs/week) | Same single container comfortably |
| 20 | 20 | ~120-200 | Tens of MBs/week | Mosquitto still fine; consider Postgres connection pooling (pgBouncer) |
| 100 | 100 | ~600-1000 | ~100s MB/week | Broker fine at this scale; move to managed Postgres; consider partitioning `ble_presence_events` by month |
| 500 | 500 | ~3000-5000 | GBs/month | Beyond a single-VM demo scope — would need broker clustering (EMQX) and read replicas; out of scope for this project but the architecture doesn't need to change in *kind*, only in deployment topology |

The chosen architecture scales in deployment footprint, not in redesign, up to roughly the 100-classroom mark — good enough headroom for "this could actually be adopted by the college" without over-building now.

---

## 30. MVP Scope

**MUST HAVE**: RFID check-in, BLE dwell-time with smoothed algorithm, FSM with offline handling, Postgres schema, MQTT with basic TLS/auth, REST API + JWT auth, teacher live dashboard, hardware simulator.

**SHOULD HAVE**: Student self-service dashboard, CSV export, device health dashboard, audit log for manual corrections, mid-session re-tap backstop.

**NICE TO HAVE**: Companion BLE app (vs. keyfob), admin analytics, multi-classroom scheduling UI, push notifications.

**DO NOT BUILD YET**: Microservices split, Kubernetes, facial recognition, native mobile apps beyond a minimal BLE-advertiser, multi-tenant/multi-institution support.

---

## 31–34. Risks, Future Improvements, Final Recommendations (see also §33 below for the core question)

**Major technical risks**: (1) BLE identity binding is unsolved by the PDF and is the make-or-break item — resolve this first, before writing a line of dwell-time code. (2) RSSI threshold requires real in-room calibration; a value that works in a test room may not work in the actual classroom. (3) iOS background restrictions are a real engineering obstacle if you attempt the companion-app route — budget real time for it or default to keyfobs.

**Future improvements**: mid-session re-tap, per-room auto-calibration wizard, ML-based RSSI classification if you have time, multi-node BLE trilateration for large halls.

---

## 33. THE MOST IMPORTANT QUESTION

**"Can this system actually provide reliable anti-proxy attendance using only RFID + ESP32 BLE RSSI + a 40-minute dwell-time threshold?"**

**Short answer: Not with unmodified smartphone BLE as the identity source — but yes, with one of two small, hardware-compatible modifications.**

Here's the honest chain of reasoning:

1. RFID alone is trivially defeated by proxy tapping — this is exactly what the PDF is trying to fix, correctly.
2. Adding *any* continuous secondary signal genuinely helps, **if and only if that signal can be reliably tied to one specific student for the duration of the session.**
3. A stock smartphone's Bluetooth radio, with no companion app, does **not** reliably provide that: MAC address randomization breaks long-term identity, and both iOS (more severely) and Android throttle or suspend background BLE activity, meaning the "student's BLE signal" the ESP32 sees may simply stop existing for stretches of the class through no fault of the student. If you ship the PDF's concept exactly as literally written — no app, no dedicated token — the BLE layer will be **unreliable enough that it either produces false ABSENT for present students (undermining trust in the system) or has to be tuned so loosely that it stops meaningfully filtering out proxy taps (undermining the entire point).**
4. **The fix does not require new hardware.** Two options, both compatible with what's already purchased:
   - **(Preferred if you have engineering time)**: a minimal companion app that advertises a fixed opaque BLE token, using iOS CoreLocation beacon-region monitoring specifically (not raw background scanning) to survive backgrounding as well as iOS allows.
   - **(Preferred if you're time-constrained)**: use the dedicated BLE keyfobs the PDF already priced as an option (~₹250–350/student). A keyfob has no OS to suspend it, so it removes the single biggest reliability risk entirely, at a real but modest per-student cost.
5. Add the mid-session random re-tap as a backstop regardless of which BLE path you choose — it uses zero additional hardware and directly defeats the "leave the token behind" failure mode that BLE alone can never fully solve.
6. With (4) + (5) in place, and with a genuinely calibrated, hysteresis-smoothed RSSI algorithm (§12) instead of a raw single-sample threshold, the system becomes a **credible, demonstrable anti-proxy attendance system** — not cryptographically unbeatable (nothing at this price point is), but meaningfully harder to game than RFID alone, and honest about its limits.

If forced to pick one smallest change to make for a hackathon/demo timeline: **skip the companion app, use keyfobs, add the re-tap backstop.** That's the path with the least engineering risk and the most reliability gain per hour invested.

---

## References (primary sources consulted)

- Apple, *Core Bluetooth Background Processing for iOS Apps* — https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/
- Apple Developer Forums, iOS BLE background suspension/kill reports — https://developer.apple.com/forums/thread/696275 , https://developer.apple.com/forums/thread/814450
- *Cost-Efficient RSSI-Based Indoor Proximity Positioning* (PMC) — https://pmc.ncbi.nlm.nih.gov/articles/PMC12074463/
- *Comparative study of indoor positioning datasets* (Scientific Reports / PMC) — https://www.nature.com/articles/s41598-025-17692-w
- *Accurate Indoor-Positioning Model Based on People Effect and Ray-Tracing Propagation* (PMC) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6960901/
- *Evaluation of the reliability of RSSI for indoor localization* — https://www.researchgate.net/publication/261447858
- MQTT.org specification and Mosquitto/Espressif documentation for MQTT/BLE/ESP32 fundamentals (general, well-established engineering references)
