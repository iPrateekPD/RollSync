# RollSync teacher authentication setup

RollSync uses Supabase Auth for email/password sign-in. Teacher records remain in `public.teachers`; the Auth UUID is stored in the existing `teachers.auth_id` column. Timetable rows continue to reference `teachers.id`.

## Environment variables

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5001/api
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Backend `.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
FRONTEND_URL=http://localhost:5174/login
```

The Supabase secret key is server-only. Never prefix it with `VITE_`, commit it, or expose it in browser code. Keep the existing database and MQTT environment variables unchanged.

## Bootstrap the first administrator

There are currently no Auth users, so the first administrator must be provisioned once from the Supabase Dashboard:

1. Open **Authentication → Users** in the RollSync Supabase project.
2. Add the administrator account using an institution-controlled email address.
3. Open that user and set **app metadata** to include this JSON property: `{"role":"ADMIN"}`.
4. Save the user. Do not put the role in user metadata; user metadata is editable by the account holder and is not trusted for authorization.
5. Sign in to RollSync with that email and password.

Only an account with `app_metadata.role = ADMIN` can access the teacher invitation endpoints.

## Invite teachers

1. Sign in as the administrator.
2. Open **Admin → Teachers**.
3. Enter the teacher's institutional email next to the existing teacher record and select **Invite**.
4. Supabase sends the invitation email. The backend assigns `app_metadata.role = TEACHER` and links the Auth user UUID to that teacher's existing `teachers.auth_id` field.
5. The teacher follows the invitation link, sets their password, and signs in at RollSync.

The invitation endpoint refuses to overwrite an existing Auth link or an email already assigned to another teacher. It does not create or rename timetable records.

## Verification

- A teacher's Auth UUID must equal `teachers.auth_id`.
- The Auth email must match `teachers.email`.
- The timetable API derives the teacher record from the verified Supabase session; it ignores caller-supplied teacher IDs or names.
- The legacy demo teacher login and hardcoded Reema Angelin session are removed from the login flow.

## Security follow-up

The current Supabase project advisor reported 11 public tables with RLS disabled. Do not enable RLS indiscriminately without policies: the backend currently uses a server-side secret key for trusted database operations, while camera/demo integrations may have separate access requirements. Design and test table-specific policies before production rollout.
