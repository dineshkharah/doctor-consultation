# Doctor Consultation Backend

A small REST API for a doctor and patient consultation platform. A patient registers, browses doctors, and opens a consultation with one. The assigned doctor accepts it, both parties chat while it is active, and the doctor closes it when done.

## Tech stack

- Node.js with Express
- TypeScript, run through `tsx` with no build step
- PostgreSQL with Prisma for migrations and a typed client
- JWT for authentication, `bcryptjs` for password hashing
- Zod for request validation

## Features

- Register and log in as a patient or a doctor, with hashed passwords and JWT auth
- Browse doctors and view a single doctor
- Create a consultation, list your own consultations, and view one you are part of
- A strict status flow for a consultation, changed only by the assigned doctor
- Chat messages inside an active consultation, limited to the two parties

## Getting started

### Prerequisites

- Node.js 18 or newer
- A PostgreSQL database. Any Postgres works: a hosted one like Supabase or Neon, a local install, or Docker.

### Setup

1. Clone the repository and enter it.

   ```
   git clone https://github.com/dineshkharah/doctor-consultation.git
   cd doctor-consultation
   ```

2. Install the dependencies.

   ```
   npm install
   ```

3. Create a `.env` file in the project root (see the next section).

4. Create the tables from the migration history.

   ```
   npx prisma migrate deploy
   ```

5. Seed a few doctors and a demo patient.

   ```
   npx prisma db seed
   ```

6. Start the server.

   ```
   npm run dev
   ```

The server runs on `http://localhost:3000`. All API routes live under `http://localhost:3000/api/v1`.

### Environment variables

Create a `.env` file with these three values:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="a long random string"
```

- `DATABASE_URL` is the connection used by the app at runtime.
- `DIRECT_URL` is the connection used by Prisma Migrate.
- For a plain Postgres, both can be the same URL. If your provider gives a connection pooler (for example Supabase), set `DATABASE_URL` to the pooled connection and `DIRECT_URL` to the direct one.
- If your database password contains special characters, percent encode them in the URL (for example `#` becomes `%23`).

To generate a strong `JWT_SECRET`:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Demo accounts

After seeding, these accounts exist. Every password is `password123`.

- Patient: `patient@example.com`
- Doctors: `grey@example.com`, `rao@example.com`, `khan@example.com`, `fernandes@example.com`, `cross@example.com`

## Database schema

Four tables. `DoctorProfile` is a separate one to one table with `User` and exists for doctors only, so patient rows carry no empty doctor columns. `Consultation` references `User` twice, once as the patient and once as the doctor.

```mermaid
erDiagram
  User ||--o| DoctorProfile : "has, doctors only"
  User ||--o{ Consultation : "as patient"
  User ||--o{ Consultation : "as doctor"
  User ||--o{ Message : "sends"
  Consultation ||--o{ Message : "contains"

  User {
    int id PK
    string name
    string email UK
    string passwordHash
    Role role
    datetime createdAt
  }
  DoctorProfile {
    int id PK
    int userId FK "unique"
    string specialization
    int yearsExperience
  }
  Consultation {
    int id PK
    int patientId FK
    int doctorId FK
    Status status
    datetime createdAt
  }
  Message {
    int id PK
    int consultationId FK
    int senderId FK
    string content
    datetime createdAt
  }
```

`Role` is `PATIENT` or `DOCTOR`. `Status` is `PENDING`, `ACTIVE`, or `COMPLETED`.

## Project structure

```
src/
├── controllers/    request and response handling per resource
├── routes/         express routers, including the api/v1 aggregator
├── services/       business logic (state machine, duplicate check)
├── middleware/     auth, validate, requireRole, error and not found handlers
├── config/         the shared prisma client
├── utils/          AppError, jwt, and password helpers
├── schemas/        zod schemas per resource
└── app.ts          express app wiring
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

## API documentation

Base URL: `http://localhost:3000/api/v1`. Authenticated routes need an `Authorization: Bearer <token>` header, using the token returned by register or login.

Every error uses the same shape:

```json
{ "error": { "message": "Email already in use", "code": "EMAIL_TAKEN" } }
```

### Auth

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | none | `name`, `email`, `password`, `role` (plus `specialization` and `yearsExperience` when `role` is `DOCTOR`) | 201, the user and a token |
| POST | `/auth/login` | none | `email`, `password` | 200, the user and a token |
| GET | `/profile` | Bearer | none | 200, the current user without the password hash |

### Doctors

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| GET | `/doctors` | Bearer | 200, a list of doctors with their profile fields |
| GET | `/doctors/:id` | Bearer | 200, a single doctor |

### Consultations

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/consultations` | Bearer, patient only | `doctorId` | 201, the created consultation as PENDING |
| GET | `/consultations` | Bearer | none | 200, the caller's own consultations |
| GET | `/consultations/:id` | Bearer, a party only | none | 200, the consultation |
| PATCH | `/consultations/:id/status` | Bearer, assigned doctor only | `status` | 200, the updated consultation |

### Chat

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | `/consultations/:id/messages` | Bearer, a party only, active only | `content` | 201, the created message |
| GET | `/consultations/:id/messages` | Bearer, a party only | none | 200, the messages in order |

### System

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| GET | `/health` | none | 200, a simple ok |

### Status codes

| Situation | Status |
| --- | --- |
| Validation error or illegal status change | 400 |
| Missing or invalid token, or wrong login | 401 |
| Authenticated but not allowed | 403 |
| Unknown consultation or doctor id | 404 |
| Duplicate email or duplicate open consultation | 409 |

## Business rules and assumptions

The spec left some points open. These are the choices made, all documented here as the assignment asks.

- Consultation status follows a strict linear flow, `PENDING` then `ACTIVE` then `COMPLETED`. No skipping, no going backward, and no change to a completed one. Any illegal change returns 400.
- Only the assigned doctor can change a consultation status. Only a patient can create a consultation.
- Reading a consultation and its messages is limited to its two parties, otherwise 403.
- Messages can be sent only while a consultation is `ACTIVE`. Sending to a `PENDING` or `COMPLETED` one returns 409. Reading messages is allowed in any status.
- A patient may not hold more than one open (`PENDING` or `ACTIVE`) consultation with the same doctor. Completed history does not block a new one.
- The message sender is always taken from the token, never from the request body.
- Browsing doctors is available to any authenticated user.
- Authentication uses an access token only, with no refresh token.

## API testing with Postman

A Postman collection is included at `Doctor-Consultation-Sanatan.postman_collection.json`, grouped into Auth, Doctors, Consultation, and Chat folders.

1. Import the file into Postman.
2. Set a variable named `URL` to `http://localhost:3000/api/v1`.
3. Run Auth then Login. It saves the returned token into an `accessToken` variable that the other requests use as their Bearer token.
