# Merkadapp Expenses API

REST API for tracking and managing personal and shared expenses across groups of people. Supports recording individual expenses with date, merchant, amount, and currency information. Designed to evolve into full group expense management with automatic debt simplification and balance calculation.

Part of the Merkadapp portfolio ecosystem:
- [merkadapp](https://github.com/raulito1500/merkadapp) — REST API in Go + MongoDB
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
| class-transformer | 0.5.x | JSON-to-class instance transformation |
| Jest | 29.x | Unit and integration testing |

---

## Architecture

The API enforces strict layer separation within each domain module:

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
│ Repository  │  Data access: MongoDB queries via Mongoose
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MongoDB   │
└─────────────┘
```

Each domain is a self-contained NestJS module. The current implementation includes the `expenses` module; the roadmap includes `groups`, `members`, and `settlements`.

---

## Folder Structure

```
src/
├── main.ts                      # Bootstrap: Swagger, ValidationPipe, CORS, listen
├── app.module.ts                # Root module: ConfigModule + MongooseModule + domains
├── config/
│   └── configuration.ts        # Config factory loaded from .env
└── expenses/
    ├── expenses.module.ts       # NestJS module: wires controller, service, providers
    ├── expenses.controller.ts   # HTTP routes (GET, POST)
    ├── expenses.service.ts      # Business logic layer
    ├── expenses.repository.ts   # Data access (abstract class + Mongoose implementation)
    ├── schemas/
    │   └── expense.schema.ts    # Mongoose schema with @Prop decorators
    └── dto/
        └── create-expense.dto.ts  # Input validation with class-validator
```

---

## API Reference

### Expenses

| Method | Path | Description | Body | Response |
|---|---|---|---|---|
| `GET` | `/expenses` | List all expenses | — | `200` Array of expenses |
| `POST` | `/expenses` | Record a new expense | `CreateExpenseDto` | `201` Created expense |

### Expense model

| Field | Type | Required | Description |
|---|---|---|---|
| `description` | `string` | ✅ | Short description of the expense |
| `merchant` | `string` | ❌ | Name of the merchant or place |
| `amount` | `number` | ✅ | Amount (≥ 0) |
| `currency` | `string` | ✅ | ISO 4217 currency code (e.g. `USD`, `COP`) |
| `date` | `string` (ISO 8601) | ✅ | Date of the expense |
| `owner` | `string` | ✅ | Name or alias of the person recording the expense |
| `createdAt` | `Date` | auto | Creation timestamp |
| `updatedAt` | `Date` | auto | Last update timestamp |

Interactive documentation is available at `/api-docs` when the server is running.

---

## Local Setup

### Prerequisites

- Node.js LTS (22.x recommended)
- A running MongoDB instance (local on port `27017`) or a MongoDB Atlas URI

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/raulito1500/merkadapp_expenses-api.git
cd merkadapp_expenses-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/merkadapp_expenses` |
| `NODE_ENV` | Execution environment | `development` |

### Running the app

```bash
# Development (watch mode — reloads on save)
npm run start:dev

# Production (requires a prior build)
npm run build
npm run start:prod
```

Server: `http://localhost:3000`
Swagger UI: `http://localhost:3000/api-docs`

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

---

## Deploy on Render

The API is ready to be deployed as a free **Web Service** on [Render](https://render.com).

### Steps

1. Create a Render account and connect your GitHub repository.
2. Select **New → Web Service**.
3. Configure the service:

| Field | Value |
|---|---|
| **Environment** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `node dist/main` |
| **Branch** | `main` |

4. Add environment variables under **Environment → Add Environment Variable**:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas cluster URI |
| `NODE_ENV` | `production` |

> `PORT` does not need to be set — Render injects it automatically at runtime.

5. Click **Deploy**. Render will run the build and start the service.

---

## Roadmap

- [ ] `members` module — member CRUD
- [ ] `groups` module — group management with member assignment
- [ ] Full `Expense` model — categories, payer reference, group, split method, embedded splits
- [ ] `settlements` module — automatic debt calculation with greedy simplification algorithm
- [ ] Authentication (JWT)
