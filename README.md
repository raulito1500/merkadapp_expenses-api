# Merkadapp Expenses API

REST API for tracking personal and shared expenses across groups of people. Supports recording individual expenses, organizing them into groups, calculating per-member balances, and ingesting transactions from external sources such as iOS Wallet.

Part of the Merkadapp ecosystem:
- [merkadapp](https://github.com/raulito1500/merkadapp) — Go + MongoDB backend (bills, products, market lists)
- [merkadapp_frontend](https://github.com/raulito1500/merkadapp_frontend) — React SPA

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | LTS (22.x) | Runtime |
| NestJS | 11.x | HTTP framework with dependency injection |
| TypeScript | 5.x | Static typing |
| MongoDB | — | Document database |
| Mongoose | 8.x | MongoDB ODM |
| @nestjs/swagger | 8.x | Auto-generated OpenAPI documentation |
| class-validator | 0.14.x | Declarative DTO validation |
| class-transformer | 0.5.x | JSON-to-class transformation |
| Jest | 29.x | Unit and integration testing |

---

## Architecture

Each domain is a self-contained NestJS module with strict layer separation:

```
HTTP Request
     │
     ▼
┌─────────────┐
│ Controller  │  HTTP layer: parses request, calls service, returns response
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  Business logic: domain rules and orchestration
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  Data access: abstract class + Mongoose implementation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MongoDB   │
└─────────────┘
```

The API currently implements three modules: `expenses`, `groups`, and `users`. A cross-cutting `auth` guard sits in front of nearly every route (see [Authentication](#authentication) below), and both `ExpensesController` and `GroupsController` inject `UsersService` to resolve raw `owner`/`paidBy`/`members` UIDs into user objects before returning a response.

---

## Authentication

Every route except `POST /expenses/ingest` requires a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

`AuthGuard` (`src/auth/auth.guard.ts`) verifies the token against Firebase Admin (initialized from the `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` env vars) and attaches the decoded `{ uid, email, name }` to the request. Handlers read the caller's identity from there — `owner` is no longer accepted as a query/body param on any guarded route. On every successful verification, the guard also best-effort upserts a `users` directory entry (uid, email, displayName, photoURL) so group members and expense owners can be resolved by other callers.

`POST /expenses/ingest` is intentionally left unguarded, since it's meant for unattended ingestion from external sources (e.g. an iOS Shortcut) rather than an interactive session.

---

## Folder Structure

```
src/
├── main.ts                          # Bootstrap: Swagger, ValidationPipe, CORS, listen
├── app.module.ts                    # Root module: ConfigModule + MongooseModule + domains
├── config/
│   └── configuration.ts            # Config factory loaded from .env
├── auth/
│   ├── auth.guard.ts                # Verifies the Firebase ID token, attaches req.user, upserts the user directory
│   ├── auth.guard.spec.ts
│   └── authenticated-request.interface.ts
├── expenses/
│   ├── expenses.module.ts
│   ├── expenses.controller.ts       # GET /expenses, POST /expenses, PATCH /expenses/:id/group, POST /expenses/ingest
│   ├── expenses.service.ts
│   ├── expenses.repository.ts       # Abstract class + MongoRepository implementation
│   ├── expenses.service.spec.ts
│   ├── expenses.controller.spec.ts
│   ├── schemas/
│   │   └── expense.schema.ts
│   └── dto/
│       ├── create-expense.dto.ts
│       ├── find-expenses-query.dto.ts
│       ├── ingest-expense.dto.ts
│       └── move-expense.dto.ts
├── groups/
│   ├── groups.module.ts
│   ├── groups.controller.ts         # GET /groups, GET /groups/:id, GET /groups/:id/summary, POST /groups
│   ├── groups.service.ts
│   ├── groups.repository.ts         # Abstract class + MongoRepository implementation
│   ├── groups.service.spec.ts
│   ├── groups.controller.spec.ts
│   ├── schemas/
│   │   └── group.schema.ts
│   └── dto/
│       ├── create-group.dto.ts
│       └── group-summary.dto.ts
└── users/
    ├── users.module.ts
    ├── users.controller.ts          # GET /users
    ├── users.service.ts             # resolveOne/resolveMany (used by expenses & groups controllers), upsert
    ├── users.repository.ts
    ├── users.service.spec.ts
    ├── schemas/
    │   └── user.schema.ts
    └── dto/
        └── user-summary.dto.ts
```

---

## API Reference

Interactive documentation is available at `/api-docs` when the server is running.

### Expenses

| Method | Path | Description |
|---|---|---|
| `GET` | `/expenses` 🔒 | List the caller's expenses, most recent first. Optional query params: `groupId`, `personal=true` |
| `POST` | `/expenses` 🔒 | Record a new expense. `owner` is taken from the authenticated caller, not the request body |
| `PATCH` | `/expenses/:id/group` 🔒 | Move an expense to a different group, or back to private (`groupId: null`) |
| `POST` | `/expenses/ingest` | Ingest an expense from an external source (e.g. iOS Wallet). Unauthenticated — see [Authentication](#authentication) |

🔒 = requires a Firebase bearer token. `owner` and `paidBy` in responses are resolved to `{ uid, email, displayName, photoURL }` objects (see the `users` module) rather than returned as raw strings.

#### Expense model

| Field | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | ✅ | Short description of the expense |
| `merchant` | `string` | — | Name of the merchant or place |
| `amount` | `number` | ✅ | Amount (≥ 0) |
| `currency` | `string` | ✅ | ISO 4217 currency code (e.g. `COP`, `USD`) |
| `date` | `string` (ISO 8601) | ✅ | Date of the expense |
| `owner` | `string` (request) / `object` (response) | ✅ | Firebase uid of the person recording the expense; resolved to a user object in responses |
| `paidBy` | `string` (request) / `object` (response) | ✅ | Firebase uid of the member who actually paid (used for balance calculation); resolved to a user object in responses |
| `groupId` | `ObjectId \| null` | — | Target group. `null` = private expense visible only to its owner |
| `metadata` | `Record<string, unknown>` | — | Flexible bag for external source fields (GPS, card info, transaction status, etc.) |
| `createdAt` | `Date` | auto | Creation timestamp |
| `updatedAt` | `Date` | auto | Last update timestamp |

#### Ingest endpoint

`POST /expenses/ingest` is designed for external sources that send amount as a formatted string. The service normalizes it across locale formats before storing:

| Format | Example | Interpreted as |
|---|---|---|
| COP (dot as thousands separator) | `"$ 59.900"` | `59900` |
| US decimal | `"59.90"` | `59.9` |
| EU decimal (comma separator) | `"59,90"` | `59.9` |
| Integer | `"59900"` | `59900` |

Unknown fields (GPS coordinates, card name, transaction status) are stored as-is in `metadata` without schema changes.

Ingested expenses always land as `currency: "COP"` with `paidBy` set to the same value as `owner` — the ingest payload has no concept of a payer distinct from the person recording it, or of a non-COP currency.

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/users` 🔒 | List every user who has ever signed in (uid, email, displayName, photoURL), sorted by display name. Used for member pickers and to resolve names in expense/group responses |

### Groups

| Method | Path | Description |
|---|---|---|
| `GET` | `/groups` 🔒 | List groups where the caller is the creator or a member |
| `GET` | `/groups/:id` 🔒 | Get a single group |
| `GET` | `/groups/:id/summary` 🔒 | Per-currency balance summary: total spent, per-person share, and individual balance for each member |
| `POST` | `/groups` 🔒 | Create a group. `owner` is taken from the authenticated caller |

#### Group model

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ | Group name |
| `owner` | `string` (request) / `object` (response) | ✅ | Creator's Firebase uid on create; resolved to `{ uid, email, displayName, photoURL }` in responses |
| `members` | `string[]` (request) / `object[]` (response) | — | Member uids on create, resolved to user objects in responses. The owner is always included (deduplication applied) |

#### Balance summary response

`GET /groups/:id/summary` returns one entry per currency found in the group's expenses. Each member entry nests the resolved user object under `user`:

```json
[
  {
    "currency": "COP",
    "total": 120000,
    "perPersonShare": 40000,
    "members": [
      { "user": { "uid": "abc123", "displayName": "Raul",  "email": "raul@example.com" },  "paid": 90000, "balance": 50000  },
      { "user": { "uid": "def456", "displayName": "Manu",  "email": "manu@example.com" },  "paid": 30000, "balance": -10000 },
      { "user": { "uid": "ghi789", "displayName": "Diana", "email": "diana@example.com" }, "paid": 0,     "balance": -40000 }
    ]
  }
]
```

A positive balance means the member paid more than their share. A negative balance means they owe the group.

---

## Local Setup

**Prerequisites:** Node.js LTS (22.x) and a MongoDB instance (local or [Atlas free tier](https://www.mongodb.com/cloud/atlas))

```bash
git clone https://github.com/raulito1500/merkadapp_expenses-api.git
cd merkadapp_expenses-api

npm install

cp .env.example .env
# Edit .env with your MongoDB URI

npm run start:dev
```

Server: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api-docs`

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/merkadapp_expenses` |
| `NODE_ENV` | Execution environment | `development` |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to call this API | `http://localhost:3001` |
| `FIREBASE_PROJECT_ID` | Firebase Admin credentials, used by `AuthGuard` to verify the ID tokens the frontend sends — from the Firebase service account JSON | `merkadapp-638bb` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin credentials (see above) — from the Firebase service account JSON | `firebase-adminsdk-xxxxx@merkadapp-638bb.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin credentials (see above) — from the Firebase service account JSON (keep the `\n` sequences as a single-line string) | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |

### Running

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Testing

```bash
npm run test        # Unit tests
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report
```

---

## Deploy on Render

The API is ready to deploy as a free Web Service on [Render](https://render.com).

1. Create a Render account and connect the GitHub repository.
2. Select **New → Web Service** and configure:

| Field | Value |
|---|---|
| **Environment** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `node dist/main` |
| **Branch** | `main` |

3. Add environment variables:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas cluster URI |
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | The deployed frontend URL(s), comma-separated |
| `FIREBASE_PROJECT_ID` | From the Firebase service account JSON |
| `FIREBASE_CLIENT_EMAIL` | From the Firebase service account JSON |
| `FIREBASE_PRIVATE_KEY` | From the Firebase service account JSON |

> `PORT` does not need to be set — Render injects it automatically.  
> `--include=dev` is required because Render sets `NODE_ENV=production`, which skips `devDependencies` by default. The NestJS CLI (`nest build`) lives there and is needed to compile TypeScript.

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — free to use, copy, modify and distribute for noncommercial purposes (personal, educational, portfolio). Commercial use requires permission from the author.
