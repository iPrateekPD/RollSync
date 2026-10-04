# Smart AI Attendance & College ERP

This is a complete college ERP platform built with React, Node.js, and PostgreSQL. It incorporates Smart AI Attendance using RFID and BLE presence detection over MQTT.

## Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Docker & Docker Compose (for PostgreSQL and Mosquitto MQTT broker)

## Project Structure
- `backend/`: Node.js Express server with Prisma and PostgreSQL.
- `frontend/`: React Vite application with Tailwind CSS and TanStack Query.
- `shared/`: Shared schemas, types, and constants.
- `firmware/`: ESP32 firmware for RFID + BLE Node.
- `simulator/`: Node.js simulator for hardware testing.
- `deploy/`: Configuration files for Docker, MQTT, etc.
- `docs/`: Technical documentation and blueprints.

## Phase 1: Quickstart

1. **Start Infrastructure (Database & MQTT Broker)**
   ```bash
   docker compose up -d
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Modules
1. **Admin ERP**: Complete institution management.
2. **Teacher Dashboard**: Class scheduling, live attendance visualization, exam marks.
3. **Student Portal**: Timetable, personal attendance, assignments, and results.
4. **Attendance Engine**: Custom FSM aggregating RFID check-ins with BLE dwell times.
