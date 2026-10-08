# Setup Guide

## Prerequisites
- Node.js (v18+)
- PlatformIO (for ESP32 firmware)
- Git
- Supabase Account
- Render / Vercel Accounts (for deployment)

## 1. Database Setup (Supabase)
1. Create a new Supabase project.
2. Navigate to `/backend` and configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-pooler.supabase.com:5432/postgres"
   ```
3. Run Prisma migrations to push the schema:
   ```bash
   cd backend
   npx prisma db push
   ```
4. Seed the database using the timetable CSV:
   ```bash
   node import-timetable.js
   ```

## 2. Backend Setup (Express + MQTT)
1. Navigate to `/backend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your MQTT Broker credentials in the `.env` file.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:3000*

## 3. Frontend Setup (React)
1. Navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the `.env` file with your Supabase URL and Anon Key.
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The client runs on http://localhost:5173*

## 4. Hardware Setup (ESP32)
1. Open the `/firmware` folder in VS Code with the PlatformIO extension.
2. Update the `src/main.cpp` with your Wi-Fi SSID and MQTT credentials.
3. Compile and upload to the ESP32 via USB.
