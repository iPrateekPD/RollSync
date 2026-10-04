# ERP Integration Module

This module is responsible for secure, seamless integration with the external GIETU ERP system (ASP.NET-based). It bridges the gap between our RollSync system and the institutional legacy system.

## Architecture

```text
Frontend -> Our Backend API -> Authenticated ERP session -> GIETU ERP endpoints -> Normalize Response -> Frontend
```

1. **ERPProvider Interface**: An abstraction defining the interactions with the ERP system.
2. **MockERPProvider**: Used for local development and testing without making real requests to the GIETU ERP. Returns deterministic sample data.
3. **RealERPProvider**: Uses `axios` to make real HTTP requests to the `https://gietuerp.in` endpoints, preserving session state and parsing responses.
4. **ERPService**: A singleton that orchestrates resolving the correct provider (Mock vs. Real) and securely handling session cookie encryption/decryption via the database.
5. **ERPController**: Express HTTP handlers mapping frontend requests to the underlying `ERPService`.

## Environment Variables

Configure the following in your backend `.env` file:

```env
# Define which provider to use. Valid options: "real" or "mock"
ERP_PROVIDER=mock

# A secure 32-byte string used for symmetrically encrypting ERP session cookies in the database.
ERP_SECRET_KEY=your_secure_random_string
```

## Local Setup

1. Run `npx prisma generate` and `npx prisma db push` to ensure the `Student` model contains the new `erpSessionCookie` field.
2. Set `ERP_PROVIDER=mock` in your `.env`.
3. Start the backend: `npm run dev`.

## Authentication Flow

1. **Client Request**: A student navigates to the "Link ERP Account" page on the frontend and inputs their GIETU ERP credentials.
2. **Backend Authentication**: The frontend sends a `POST /api/erp/login` request.
3. **ERP Authentication**: `RealERPProvider` authenticates against the GIETU ERP login endpoint and extracts the `set-cookie` header representing the authenticated session.
4. **Secure Storage**: The `ERPService` symmetrically encrypts this session cookie using `ERP_SECRET_KEY` and saves it to the `erpSessionCookie` column in the student's database record.
5. **Subsequent Requests**: When the frontend requests attendance data, the backend decrypts the cookie, passes it to the `RealERPProvider`, and fetches the data from the ERP on the user's behalf.

*Note: The frontend NEVER sees the ERP session cookie. It only uses our system's JWT to authenticate with our backend.*

## Security Considerations

- **Encryption at Rest**: ERP session cookies are never stored in plain text in the database. They are encrypted using `aes-256-cbc`.
- **No Cookie Exposure**: The ERP session cookie is never exposed in any API response to the frontend.
- **Authorization**: Access to all `/api/erp/*` routes is heavily restricted by Role-Based Access Control (RBAC). Only users with the `STUDENT` role can access their endpoints.
- **IDOR Prevention**: The requested roll number is NOT read from the frontend payload. It is retrieved directly from the authenticated user's verified `Student` database record. A student cannot access another student's data by manipulating request parameters.
- **No Hardcoded Credentials**: API secrets and encryption keys are strictly managed via environment variables.
- **Structured Error Handling**: If an ERP session expires or the ERP returns a `401/403`, our backend intercepts it and returns a standard `ERP_SESSION_EXPIRED` error, prompting the user to re-link their account.

## API Endpoints

All endpoints require a valid Bearer JWT belonging to a user with the `STUDENT` role.

### `POST /api/erp/login`
Links the ERP account to the currently authenticated student.
**Body:**
```json
{
  "username": "24ECE002",
  "password": "secretpassword"
}
```

### `GET /api/erp/attendance/day-wise`
Fetches the day-by-day attendance from the ERP.
**Example Response:**
```json
{
  "student": {
    "rollNo": "24ECE002"
  },
  "attendance": [
    {
      "date": "2026-09-28",
      "subject": "DSP",
      "attended": 1,
      "held": 1,
      "percentage": 100
    }
  ]
}
```

### `GET /api/erp/attendance/subject-wise`
Fetches the aggregated attendance grouped by subject.

### `GET /api/erp/student/academic`
Fetches semester-level academic details.

### `GET /api/erp/student/grades`
Fetches SGPA and subject-wise grades.

## Switching Between Providers
To switch to the real ERP system in production or for testing:
1. Change `ERP_PROVIDER=real` in your `.env`.
2. Restart the Node.js process.
