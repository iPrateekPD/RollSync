# Database Schema (Supabase + Prisma)

The database relies on PostgreSQL hosted by Supabase and is managed strictly through Prisma.

## Core Models

### `students`
- `id` (UUID, PK)
- `name` (String)
- `roll_number` (String, Unique)
- `rfid_uid` (String, Unique) - Mapped to physical ID cards
- `section` (String)
- `created_at` (DateTime)

### `teachers`
- `id` (UUID, PK)
- `name` (String, Unique)
- `created_at` (DateTime)

### `subjects`
- `id` (UUID, PK)
- `subject_code` (String, Unique)
- `subject_name` (String)

### `timetable`
- `id` (UUID, PK)
- `day` (String) - `MON`, `TUE`, `WED`, `THU`, `FRI`
- `start_time` (String)
- `end_time` (String)
- `subject_id` (FK to subjects)
- `teacher_id` (FK to teachers)
- `section` (String)
- `room` (String)
- `type` (String) - `lecture`, `lab`, `project`
- `is_continuous` (Boolean) - True if merged with adjacent periods

### `attendance_sessions`
- `id` (UUID, PK)
- `timetable_id` (FK to timetable)
- `date` (DateTime)
- `status` (String) - `ACTIVE`, `REVIEW`, `CONFIRMED`

### `attendance_logs`
- `id` (UUID, PK)
- `session_id` (FK to attendance_sessions)
- `student_id` (FK to students)
- `timestamp` (DateTime) - Exact moment the RFID was scanned
- `status` (String) - `PRESENT`, `LATE`, `EXCEPTION`

## Migrations
All schema changes MUST be done in `backend/prisma/schema.prisma` and pushed using:
```bash
npx prisma db push
```
