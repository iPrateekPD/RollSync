# RollSync — Local Setup Guide

> **Last updated:** 10 November 2026  
> This guide follows the repository layout and package scripts inspected for this documentation revision. Confirm any command against the current branch before using it on production data.

## 1. Prerequisites

- Git.
- Node.js compatible with the versions declared in the project manifests (frontend requires a modern Node version compatible with Vite 8; backend package lists Node types 26).
- npm.
- PlatformIO CLI or VS Code PlatformIO extension for firmware.
- Supabase project and PostgreSQL connection strings.
- MQTT broker access.
- Python 3 and the AI service dependencies if the camera service is included in the current checkout.
- USB cable and ESP32-S3 board for hardware testing.

## 2. Clone the repository

```bash
git clone https://github.com/iPrateekPD/RollSync.git
cd RollSync
```

The repository URL is based on the project repository previously inspected. If the repository has been renamed or moved, use its current clone URL.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The supplied setup guide documents Vite at:

`http://localhost:5173`

Build:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

The frontend package declares scripts `dev`, `build`, `lint`, and `preview`.

Configure only the frontend environment variables actually referenced by the source. The older setup guide mentions Supabase URL and anon key, but verify whether the current frontend uses Supabase directly, the Node API, or both. Do not invent variable names.

## 4. Backend setup

```bash
cd backend
npm install
```

The backend package defines:

```bash
npm run dev
npm run build
npm start
```

The documented local backend URL is:

`http://localhost:3000`

The dev script is `nodemon src/server.ts`; the build script is `tsc`; the start script is `node dist/server.js`.

## 5. Database configuration

The Prisma schema references:

```env
DATABASE_URL=...
DIRECT_URL=...
```

Use the connection strings supplied by your own Supabase project. Do not paste real credentials into documentation, Git, screenshots, or public issue trackers.

Generate Prisma client:

```bash
cd backend
npx prisma generate
```

The supplied setup guide uses:

```bash
npx prisma db push
```

Only run schema synchronization after confirming the target database, reviewing the schema diff, and backing up any important data. For production, use a reviewed migration workflow rather than casually pushing schema changes.

## 6. Seed and import data

The backend package declares a Prisma seed command:

```text
ts-node prisma/seed.ts
```

The supplied setup guide also references:

```bash
node import-timetable.js
```

Before running an import:
- Confirm the script exists at the stated path.
- Confirm the CSV format and headers.
- Back up the database.
- Check whether the operation inserts, updates, or deletes data.
- Verify row counts and duplicate handling.

Do not assume a timetable import script also imports student records.

## 7. MQTT configuration

The firmware reads MQTT settings through `firmware/src/config.h`. The backend's MQTT configuration must be obtained from its actual environment-variable references and source.

Configure:
- Broker host.
- Broker port.
- Client/device identity.
- Username/password if required.
- Device topic constants.
- Backend subscription topics.

The current documents contain conflicting topic conventions. See [mqtt-contract.md](mqtt-contract.md). Do not test with production credentials until firmware and backend topic/payload formats have been aligned.

## 8. Firmware setup

```bash
cd firmware
pio run
```

Upload:

```bash
pio run --target upload
```

Serial monitor:

```bash
pio device monitor
```

The inspected PlatformIO project uses:
- Environment: `esp32-s3-devkitc-1`
- Framework: Arduino
- Monitor speed: 115200

Configure local Wi-Fi/MQTT settings in the appropriate local config file. Verify the exact pin definitions in `config.h` before wiring.

## 9. Python camera service

The project progress documentation describes a FastAPI service using InsightFace and OpenCV. The complete Python directory, dependency file, and startup command were not available in the inspected materials used for this guide.

To run it correctly, inspect the current AI service directory and follow its actual dependency manifest and application entry point. Do not assume a module name, port, or environment variable that is not present in the repository.

At minimum, verify:
- Python version.
- `requirements.txt` or `pyproject.toml`.
- FastAPI app entry point.
- Model download/cache requirements.
- Supabase/database connection method.
- Camera upload endpoint.
- CORS and authentication configuration.

## 10. Start services for local development

The intended local service arrangement is:

| Service | Documented local address |
|---|---|
| Frontend | `http://localhost:5173` |
| Node backend | `http://localhost:3000` |
| Database | Supabase-hosted PostgreSQL |
| MQTT | Configured broker |
| AI service | Determine from its actual FastAPI configuration |

Start each persistent service in its own terminal. Start the backend before relying on frontend API requests. Start the MQTT broker or configure a reachable broker before testing device events.

## 11. Environment variable inventory

Only the following variable names are evidenced in the inspected files:

| Variable | Service | Purpose | Required |
|---|---|---|---|
| `DATABASE_URL` | Backend/Prisma | Pooled or application DB connection | Yes for Prisma DB access |
| `DIRECT_URL` | Backend/Prisma | Direct DB connection used by Prisma | Yes according to current schema |
| `WIFI_SSID` | Firmware config | Wi-Fi network name | Yes |
| `WIFI_PASSWORD` | Firmware config | Wi-Fi password | Yes if network secured |
| `MQTT_SERVER` or equivalent config constant | Firmware | Broker host | Confirm exact name in `config.h` |
| `MQTT_PORT` | Firmware | Broker port | Confirm exact name in `config.h` |
| `MQTT_USER` | Firmware | Broker username | Depends on broker |
| `MQTT_PASSWORD` | Firmware | Broker password | Depends on broker |

The supplied setup guide mentions frontend Supabase URL/anon key and MQTT backend variables but does not provide verified variable names. Inspect source references before adding them to `.env`.

## 12. Local verification checklist

- [ ] Frontend dependencies install.
- [ ] Frontend development server starts.
- [ ] Frontend production build succeeds.
- [ ] Backend dependencies install.
- [ ] Prisma client generates.
- [ ] Backend starts without errors.
- [ ] Database connection succeeds.
- [ ] Required tables exist.
- [ ] Seed/import scripts are confirmed before running.
- [ ] MQTT broker connection succeeds.
- [ ] Firmware compiles.
- [ ] ESP32 connects to Wi-Fi.
- [ ] RFID UID is read.
- [ ] Backend receives the event.
- [ ] Camera service starts.
- [ ] Camera enrollment/session flow is tested.
- [ ] Teacher confirmation persists.

## 13. Troubleshooting

| Problem | Checks |
|---|---|
| Frontend cannot reach backend | Confirm backend URL, CORS, port, and local environment. |
| Prisma connection fails | Check `DATABASE_URL`, `DIRECT_URL`, Supabase project status, network, and credentials. |
| Prisma client missing | Run `npx prisma generate` from backend. |
| Backend fails to start | Check Node version, dependencies, environment variables, and `src/server.ts`. |
| MQTT not connecting | Check broker host/port, credentials, network, client ID, and ACL. |
| RFID event not processed | Compare actual firmware topic/payload with backend subscription. |
| OLED blank | Check I²C wiring and address `0x3C`. |
| Camera service fails | Check Python dependencies, model availability, memory, and service configuration. |

## 14. Related documentation

- [Architecture](ARCHITECTURE.md)
- [Database schema](DATABASE_SCHEMA.md)
- [API reference](API_REFERENCE.md)
- [Hardware setup](HARDWARE_SETUP.md)
- [MQTT contract](mqtt-contract.md)
- [AI camera specification](AI_CAMERA_SPEC.md)
- [Deployment guide](DEPLOYMENT_GUIDE.md)
