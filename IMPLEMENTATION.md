# IMPLEMENTATION.md
### RollSync — Intelligent Attendance & Presence Verification — What To Build, In What Order, Starting Today

This file is the execution plan. It does not re-explain the architecture (that lives in `RollSync_Blueprint.md` and `RollSync_Master_Technical_Blueprint.pdf`) — it tells you **what to open your editor and build, in what sequence**, and gives you the **wiring/pin diagram** neither of those documents included.

---

## 0. Reconciling the two blueprints (30-second read)

Both documents agree on the important calls: MQTT (hybrid with REST), Postgres, Node.js/Express + TypeScript, React, Socket.IO, server-side (not ESP32-side) dwell accumulation, and — critically — that **raw smartphone BLE cannot be trusted as an identity source**, with a beacon keyfob as the pragmatic fix.

The **Master Technical Blueprint (PDF)** is more implementation-ready and is the one to actually code against: it has exact topic names, exact JSON payload shapes, a concrete EMA+hysteresis+epoch dwell algorithm, a leaner 11-table schema, and named unit tests (T1–T12). Treat it as the **primary spec**. Treat the first blueprint as background reading for the *reasoning* behind the same decisions.

**Decision: build against the Master Technical Blueprint's contracts exactly** — its topic names (`school/att/devices/{deviceId}/evt|hb|ack|cmd|status`), its payload shapes, its schema, and its T1–T12 test table. Don't mix field names between the two documents.

---

## 1. The one-sentence answer to "simulator and backend first, or what"

**Yes — simulator and backend first, before a single line of firmware or frontend.** Order: **contract doc → Docker infra → DB schema → simulator → backend consumer/engine (tested against the simulator) → REST API → frontend → realtime → security hardening → THEN real ESP32 firmware integration → calibration → deploy.** You (software) can complete roughly 80% of the project without your teammate's hardware being ready, because the simulator speaks the exact same MQTT contract the real ESP32 will speak later.

---

## 2. Build Order — Day by Day

### Day 1 — Contract + Infra (no code logic yet, just plumbing)
1. Write `docs/mqtt-contract.md` — copy the topic list, QoS table, and the 4 example payloads (`rfid_tap`, `ble_batch`, `ack`, heartbeat) from the Master Blueprint §13 verbatim. **Get your hardware teammate to read and sign off on this before writing firmware** — this file is the only thing that lets you both work in parallel without integration surprises.
2. `git init` the monorepo with the structure from Master Blueprint §28 (`backend/ frontend/ simulator/ firmware/ deploy/ shared/ docs/`).
3. `docker-compose.yml` with Mosquitto + Postgres (plaintext MQTT on the internal Docker network for now; TLS is a later toggle, not a day-1 blocker).
4. Confirm both containers start and you can `mosquitto_pub`/`mosquitto_sub` a test message manually.

**Definition of done**: `docker compose up` gives you a running broker + DB, and the contract doc exists and is agreed.

### Day 2–3 — Database
1. Write `prisma/schema.prisma` using the 11-table schema from Master Blueprint §12 (users, students, teachers, rfid_cards, ble_identities, classrooms, devices, courses, class_sessions, attendance_sessions, rfid_events, ble_observations, device_heartbeats, audit_logs).
2. Run the first migration, write a `seed.ts` that creates: 1 admin, 1 teacher, 3–5 fake students with RFID UIDs + BLE tokens, 1 classroom, 1 device row, 1 course, 1 class_session.
3. Sanity check with Prisma Studio that seeded rows look right.

**Definition of done**: `npx prisma studio` shows a populated, correctly-related schema.

### Day 4–6 — Simulator (before backend logic — build the thing you'll test against first)
1. `simulator/` — a small Node.js CLI using `mqtt.js`, publishing to the exact contract topics.
2. Implement the core scenario functions from Master Blueprint §25: `tap(studentUid)`, `bleBatch([{token, mac, rssi}])`, `walkOut()`, `walkIn()`, `shortBreak(min)`, `longAbsence(min)`, `wifiOutage(min)`, `duplicateFlood()`, `reboot()`.
3. Wire up the T1–T12 scenarios from Master Blueprint §26 as named, runnable scripts (`sim.js --scenario T1`, etc.) — these become your backend test fixtures.
4. Verify with `mosquitto_sub -t 'school/att/devices/#' -v` that the simulator's traffic looks exactly like the contract doc.

**Definition of done**: you can run `sim.js --scenario T1` and watch realistic RFID + BLE-batch MQTT traffic flow, with nothing else built yet.

### Day 7–10 — Backend: consumer + attendance engine (the core of the whole project)
1. Express + TypeScript skeleton, env validation (`envalid`/Zod), pino logging, `/healthz`.
2. MQTT consumer (`mqtt.js`) subscribing to `school/att/devices/+/evt` and `.../hb`, validating payloads with Zod, writing raw rows to `rfid_events` / `ble_observations`, with `eventId` unique-constraint dedup (idempotency — this one constraint does most of your reliability work for free).
3. **Write the attendance engine as pure, framework-free functions first** — no MQTT, no Express, no DB — just `(currentState, newObservation) → nextState`. This is what makes it unit-testable and is the single highest-value piece of code in the project.
4. Implement the epoch/EMA/hysteresis dwell algorithm exactly as specified in Master Blueprint §16 (15s epochs, EMA α=0.3, dual threshold with hysteresis band, CONFIRM_K/DROP_K streaks, grace period that pauses rather than resets, proration for late arrivals).
5. Wire the pure engine into a scheduled job (node-cron, every 15s) that reads new observations and drives `attendance_sessions` state.
6. **Write the T1–T12 tests now**, running the simulator scenarios end-to-end against a test database, asserting final states match the table in Master Blueprint §26. Do not move on until these pass — this is your proof the core logic works before any UI exists.

**Definition of done**: all 12 test scenarios pass against real MQTT traffic from the simulator, with zero frontend or firmware involved.

### Day 11–13 — REST API + Auth
1. JWT auth (15-min access + httpOnly refresh cookie), bcrypt, RBAC middleware for ADMIN/TEACHER/STUDENT.
2. Implement the endpoint table from Master Blueprint §21: auth, students/teachers/classrooms/courses CRUD, devices + provisioning, sessions start/end/live, corrections (audit-logged), attendance export, raw events explorer.
3. Supertest coverage for auth flows and RBAC denials (e.g., confirm a STUDENT token gets 403 on an admin route).

**Definition of done**: you can log in, create a session via Postman, run a simulator scenario against it, and `GET /api/sessions/:id/live` shows correct per-student state.

### Day 14–18 — Frontend
1. React + Vite + TS + Tailwind, `AuthContext`/`ProtectedRoute`, TanStack Query for server state.
2. Build Teacher → Live Session view first (it's the demo centerpiece): one card per student, state badge, dwell ring, RSSI sparkline, device health pill.
3. Then Student "my attendance" and Admin CRUD screens (students, devices, cards/beacons, audit log, raw events explorer).
4. Point it at the same simulator-driven backend — you can demo the entire product with zero hardware at this point.

**Definition of done**: running a simulator scenario visibly updates the live dashboard in the browser via REST poll, before WebSockets even exist.

### Day 19–20 — Realtime
1. Socket.IO server, room-per-session (`session:{id}`) and an admin room for device deltas.
2. Engine emits `session_delta` on every state change; frontend merges deltas into its TanStack Query cache instead of re-polling.

**Definition of done**: dashboard updates instantly (no refresh, no poll delay) while a simulator scenario runs.

### Day 21–22 — Security pass
1. TLS toggle on Mosquitto (8883), per-device ACL file, rotate demo credentials.
2. Rate limiting on `/auth/login`, audit logging on every teacher/admin mutation, secrets via `.env`/Docker secrets only.
3. Confirm: a device can only publish/subscribe under its own topic path (negative ACL test), and JWT-less requests to protected routes are rejected.

**Definition of done**: the negative security tests in Master Blueprint §26 ("MQTT contract" tests) pass.

### Day 23 onward — Hand off to firmware, THEN integrate
This is the point where your hardware teammate's ESP32 work needs to exist. Up to here, **nothing was blocked on hardware.**

1. Hardware teammate flashes firmware against the same contract doc from Day 1 (RC522 read → debounce → NVS outbox → MQTT publish; NimBLE passive scan → 15s batch → publish; subscribe to `ack`/`cmd`; heartbeat every 30s; LWT).
2. Swap the simulator's device ID for the real device ID in a test session — the backend should not need a single code change, because it never knew the difference between simulated and real traffic.
3. Run the physical version of tests T1, T2, T6 (duplicate taps), T7 (Wi-Fi outage + replay) with the real board.

### Day after that — Calibration, full pilot, deploy
Follow Master Blueprint §16's calibration procedure (walk-test RSSI at 5 desk spots + door + hallway, set `RSSI_ENTER`/`RSSI_EXIT` from real data) and §30 deployment plan (VPS + Docker Compose + Caddy TLS).

---

## 3. Wiring / Pin Diagram (missing from both prior documents)

This is a standard, safe ESP32-WROOM-32 wiring layout for RC522 (SPI) + 0.96" I2C OLED + status LEDs + active buzzer. **Give this section directly to your hardware teammate.**

### 3.1 GPIO assignment table

| Module | Module Pin | ESP32 GPIO | Notes |
|---|---|---|---|
| RC522 (RFID, SPI) | SDA (aka SS/CS) | **GPIO 5** | Chip-select, software-selectable |
| RC522 | SCK | **GPIO 18** | Hardware VSPI clock |
| RC522 | MOSI | **GPIO 23** | Hardware VSPI MOSI |
| RC522 | MISO | **GPIO 19** | Hardware VSPI MISO |
| RC522 | RST | **GPIO 4** | Reset line |
| RC522 | 3.3V | **3V3** | **RC522 is 3.3V-only — never connect to 5V, it will damage the module** |
| RC522 | GND | **GND** | Common ground |
| OLED (I2C, 128x64) | SDA | **GPIO 21** | Default ESP32 I2C data |
| OLED | SCL | **GPIO 22** | Default ESP32 I2C clock |
| OLED | VCC | **3V3** (or 5V if your specific module is 5V-tolerant — check silkscreen) | |
| OLED | GND | **GND** | |
| Green LED | Anode → 220Ω resistor → | **GPIO 25** | Cathode to GND |
| Red LED | Anode → 220Ω resistor → | **GPIO 26** | Cathode to GND |
| Active buzzer | Signal | **GPIO 27** | See driving note below |
| Power in | 5V 2A adapter | **VIN / 5V pin** | Powers the ESP32 dev board's onboard regulator |

Why GPIO 4 for RC522 RST instead of 22: GPIO 22 is reserved for I2C SCL to the OLED — reusing it for RST would create a bus conflict. All other pins above are chosen specifically to avoid collisions between SPI, I2C, and the digital outputs.

**Driving the buzzer**: if your active buzzer draws more than ~12–15 mA, don't drive it directly off a GPIO — use a small NPN transistor (e.g., 2N2222/S8050) as a switch: GPIO27 → 1kΩ resistor → transistor base; buzzer's + lead → 5V; buzzer's − lead → transistor collector; transistor emitter → GND. This protects the ESP32 pin and gives you a louder, more reliable beep. If your buzzer module already has a built-in driver transistor (most "active buzzer modules" with 3 pins do), you can drive it directly from GPIO27.

### 3.2 ASCII wiring diagram

```
                                   5V 2A DC Adapter
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │   ESP32-WROOM-32  │
                                 │    Dev Board       │
                                 │                    │
        RC522 (RFID, 3.3V ONLY) │                    │      0.96" I2C OLED
        ┌───────────┐            │                    │        ┌───────────┐
        │   SDA/SS  │──GPIO5────►│ GPIO5              │        │    VCC    │──3V3
        │   SCK     │──GPIO18───►│ GPIO18   GPIO21    │◄──SDA──│    SDA    │
        │   MOSI    │──GPIO23───►│ GPIO23   GPIO22    │◄──SCL──│    SCL    │
        │   MISO    │◄─GPIO19────│ GPIO19             │        │    GND    │──GND
        │   RST     │◄─GPIO4─────│ GPIO4              │        └───────────┘
        │   3.3V    │◄───────────│ 3V3
        │   GND     │◄───────────│ GND
        └───────────┘            │                    │
                                 │           GPIO25 ───┼──[220Ω]──►|── GND   (Green LED)
                                 │           GPIO26 ───┼──[220Ω]──►|── GND   (Red LED)
                                 │           GPIO27 ───┼──[1kΩ]──► NPN Base
                                 │                    │            (transistor switches
                                 │                    │             5V → Active Buzzer → GND)
                                 │                    │
                                 │        VIN/5V ◄─────┼──── 5V 2A Adapter (+)
                                 │        GND    ◄─────┼──── 5V 2A Adapter (−)
                                 └──────────────────┘
```

### 3.3 Firmware GPIO constants (drop straight into the firmware project)

```cpp
// RC522 (VSPI)
#define RFID_SS_PIN   5
#define RFID_RST_PIN  4
// SCK=18, MOSI=23, MISO=19 are the ESP32's default VSPI pins — no #define needed,
// just call SPI.begin() with defaults.

// OLED (I2C) — SDA=21, SCL=22 are the ESP32 default Wire() pins, no #define needed.

// Feedback outputs
#define LED_GREEN_PIN 25
#define LED_RED_PIN   26
#define BUZZER_PIN    27
```

### 3.4 Bring-up checklist for the hardware teammate
1. Power the bare ESP32 alone first — confirm it boots and connects to Wi-Fi before attaching any peripheral.
2. Wire and test RC522 alone (read a card UID over Serial) before adding the OLED.
3. Add the OLED, confirm `Wire.begin(21,22)` finds it at its I2C address (usually `0x3C`) via an I2C scanner sketch.
4. Add LEDs + buzzer last — they're the lowest-risk, easiest-to-debug-visually part.
5. Only after all four work independently, load the actual firmware (RC522 read → debounce → MQTT publish → NimBLE scan → batch publish → subscribe ack/cmd) from the contract doc.

---

## 4. What "done" looks like before you touch hardware at all

By the end of Day 20 (before any ESP32 is involved), you should be able to:
- Run `sim.js --scenario T1` and watch a teacher's live dashboard show a student go `CHECKED_IN → MONITORING → VERIFIED` in real time over Socket.IO.
- Run `sim.js --scenario T7` (Wi-Fi outage + replay) and confirm no duplicate dwell time is recorded.
- Log in as each of the three roles and confirm RBAC blocks cross-role access.

If all three of those work, hardware integration is a **contract test, not a rewrite** — exactly the property the simulator strategy is designed to guarantee.
