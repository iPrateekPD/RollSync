# RollSync — Deployment Guide

> **Status:** Intended topology documented; live deployment state must be verified.  
> **Last updated:** 10 November 2026

## 1. Deployment overview

The project's existing architecture document describes this intended deployment:

| Component | Intended provider |
|---|---|
| React/Vite frontend | Vercel |
| Node.js/Express backend | Render |
| PostgreSQL | Supabase |
| Python/FastAPI AI service | Local or GPU cloud |
| MQTT broker | Configured external broker |
| Classroom camera | Android phone initially; RTSP camera considered future scope |

These are previously documented hosting choices, not confirmation that each service is currently deployed and healthy.

## 2. Frontend deployment

Build the frontend from `frontend/`:

```bash
cd frontend
npm install
npm run build
```

Deploy the generated Vite build using the current Vercel project configuration.

Verify:
- Build command.
- Output directory (`dist` for standard Vite).
- Required frontend environment variables.
- Backend API base URL.
- SPA rewrite/fallback behavior.
- CORS from the backend.
- Production build and browser console.

Do not expose service-role keys or backend secrets in frontend variables.

## 3. Node.js backend deployment

The backend package defines:
- `npm run build`
- `npm start`

The documented intended provider is Render. Confirm the actual service root directory, build command, start command, environment variables, and health-check route.

The backend is expected to maintain MQTT connectivity. Use a persistent web service/worker process capable of maintaining a long-running MQTT connection; do not rely on a short-lived serverless invocation for a permanent subscriber.

Verify:
- Node runtime.
- Install/build logs.
- `DATABASE_URL` and `DIRECT_URL`.
- MQTT broker host, port, credentials, and topic configuration.
- CORS origins.
- JWT/auth secrets if used.
- Health endpoint.
- Restart behavior.
- Logs and error reporting.

## 4. Supabase database

The Prisma datasource uses PostgreSQL with:
- `DATABASE_URL`
- `DIRECT_URL`

Use the appropriate Supabase connection strings. Keep credentials in the provider's secret/environment-variable settings.

Before production schema changes:
1. Back up the database.
2. Review Prisma schema changes.
3. Use the chosen migration workflow.
4. Verify the resulting tables and constraints.
5. Test application queries.

The project's live Supabase status must be checked in the Supabase dashboard; do not infer it from a local schema file.

## 5. MQTT broker

Configure the broker and device/backend credentials separately.

Required checks:
- TLS where supported.
- Per-device credentials.
- Topic ACLs.
- Unique client IDs.
- Last Will and retained status.
- QoS behavior.
- Reconnect behavior.
- Backend subscription persistence.

Before release, resolve the topic and payload mismatch documented in [mqtt-contract.md](mqtt-contract.md).

## 6. Python AI service

The architecture notes describe local or GPU-cloud hosting. The actual provider, service root, command, port, and environment variables must be taken from the Python service's dependency and application configuration.

Production requirements:
- Sufficient CPU/GPU memory for model loading.
- Model cache persistence where required.
- HTTPS.
- Authenticated camera requests.
- Short-lived session tokens.
- Restricted database access.
- Request size limits.
- Monitoring for memory and inference latency.

## 7. Android camera connectivity

If the phone camera sends images to a cloud-hosted service:
- Use HTTPS.
- Use a session-specific token.
- Avoid exposing internal database credentials.
- Configure upload size and rate limits.
- Handle network loss and retries.
- Ensure camera uploads are accepted only for active sessions.

For local demonstrations, a secure tunnel may be used temporarily. Do not use a public tunnel as a permanent production deployment without access controls.

## 8. Environment and secret management

Use each provider's secret manager/environment settings. Never commit:
- Database passwords.
- Supabase service-role keys.
- JWT secrets.
- MQTT passwords.
- Wi-Fi credentials.
- Camera session signing secrets.

Only set variables that the actual application source reads.

## 9. Release validation

- [ ] Frontend production build passes.
- [ ] Frontend URL loads.
- [ ] Backend service is healthy.
- [ ] Database connection succeeds.
- [ ] Prisma client/schema are compatible.
- [ ] MQTT broker connection succeeds.
- [ ] Backend receives device events.
- [ ] Device acknowledgement works.
- [ ] AI service loads model.
- [ ] Camera upload works securely.
- [ ] Teacher review and confirmation work.
- [ ] Logs and monitoring are accessible.
- [ ] Secrets are not exposed in browser bundles or Git.
- [ ] Backup and rollback plan exists.

## 10. Operational recovery

Document provider-specific rollback and recovery steps once the live providers are confirmed. At minimum:
- Keep a known-good frontend deployment.
- Keep a known-good backend release.
- Back up PostgreSQL before migrations.
- Preserve firmware build artifacts and version identifiers.
- Monitor MQTT disconnects and device last-seen timestamps.
- Maintain a manual attendance fallback if camera or network services fail.
