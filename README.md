# Yohanan Coffee Sales Audit System

A production-ready full-stack system for recording and auditing daily coffee shop sales.
Built for **Yohanan Coffee**, Addis Ababa, Ethiopia.

---

## Overview

**Purpose:** Replace manual sales books with a digital audit trail.

**Roles:**
- **Waiter** — records sales on a mobile-friendly interface
- **Owner** — reviews, verifies, or disputes every sale against the physical book

**Core workflow:**
1. Waiter logs in → selects product → enters quantity → sale saved as **PENDING**
2. Owner reviews → compares with paper book → marks **VERIFIED** or **DISPUTED**
3. Every audit action creates a permanent `audit_records` row
4. Owner can close the day and view historical daily reports

---

## Features

- JWT authentication with role-based access (OWNER / WAITER)
- Waiter mobile-first sale entry (3-tap flow: category → product → quantity)
- Unique sale numbers (`SALE-20260919-0001`)
- Historical price preservation — price changes never alter old sales
- Owner audit dashboard with verify / dispute actions
- Dispute modal requiring a written reason
- Daily closing with pending-sale warning
- Daily reports: by waiter, by product, audit summary
- Full-text search + filters (date, waiter, product, status)
- All monetary calculations on the backend

---

## Technology Stack

| Layer     | Stack                                          |
|-----------|------------------------------------------------|
| Frontend  | React 18, Vite, Material UI 5, React Router 6  |
| Backend   | Node.js, Express.js, JWT, bcrypt               |
| Database  | PostgreSQL (no ORMs, raw SQL with `pg`)         |
| Auth      | JWT Bearer tokens, bcrypt (12 rounds)          |
| Security  | Helmet, CORS, express-validator, parameterized queries |

---

## Project Structure

```
yohanan-sales-audit/
├── database/
│   ├── schema.sql          # All CREATE TABLE, indexes, triggers
│   └── seed.sql            # Sample products and hashed users
├── backend/
│   ├── src/
│   │   ├── controllers/    # Business logic per resource
│   │   ├── routes/         # Express routers
│   │   ├── middleware/      # auth, validate, errorHandler
│   │   ├── utils/           # response helpers, saleNumber
│   │   └── db/pool.js       # pg Pool singleton
│   ├── migrations/migrate.js
│   ├── seeds/seed.js
│   ├── __tests__/           # Jest + supertest tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/        # AuthContext (JWT + user state)
│   │   ├── services/       # Axios service modules per resource
│   │   ├── pages/          # owner/ and waiter/ pages
│   │   ├── layouts/        # OwnerLayout (sidebar), WaiterLayout (bottom nav)
│   │   ├── components/     # Reusable UI components
│   │   ├── utils/          # formatCurrency, formatDate, etc.
│   │   └── theme/          # MUI warm coffee-house theme
│   └── package.json
└── README.md
```

---

## Requirements

- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## PostgreSQL Setup

### 1. Create the database

```sql
CREATE DATABASE yohanan_sales;
```

Or via psql:

```bash
psql -U postgres -c "CREATE DATABASE yohanan_sales;"
```

### 2. Run the schema migration

```bash
cd backend
node migrations/migrate.js
```

### 3. Run seed data

```bash
node seeds/seed.js
```

This creates all users and products with hashed passwords.

---

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and a strong JWT_SECRET
npm run dev
```

The API will start on `http://localhost:5000`.

### Backend .env

```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/yohanan_sales
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env only needs VITE_API_URL
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Frontend .env

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running Locally (full stack)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd yohanan-sales-audit/backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd yohanan-sales-audit/frontend
npm run dev
```

Then open: [http://localhost:5173](http://localhost:5173)

---

## Default Development Accounts

> ⚠️ **Change all passwords before production!**

| Role   | Username | Password   |
|--------|----------|------------|
| OWNER  | owner    | owner123   |
| WAITER | hana     | waiter123  |
| WAITER | sara     | waiter123  |
| WAITER | abel     | waiter123  |

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint        | Access  | Description          |
|--------|-----------------|---------|----------------------|
| POST   | /auth/login     | Public  | Get JWT token        |
| GET    | /auth/me        | Any     | Current user info    |

### Products
| Method | Endpoint                  | Access  |
|--------|---------------------------|---------|
| GET    | /products                 | Any     |
| GET    | /products/:id             | Any     |
| POST   | /products                 | OWNER   |
| PUT    | /products/:id             | OWNER   |
| PATCH  | /products/:id/status      | OWNER   |

### Sales
| Method | Endpoint          | Access       |
|--------|-------------------|--------------|
| POST   | /sales            | WAITER only  |
| GET    | /sales            | OWNER        |
| GET    | /sales/today      | OWNER        |
| GET    | /sales/my-sales   | Any          |
| GET    | /sales/:id        | Any (own)    |

### Audits
| Method | Endpoint                    | Access  |
|--------|-----------------------------|---------|
| POST   | /audits/:saleId/verify      | OWNER   |
| POST   | /audits/:saleId/dispute     | OWNER   |
| GET    | /audits                     | OWNER   |
| GET    | /audits/:saleId             | OWNER   |

### Reports
| Method | Endpoint                     | Access  |
|--------|------------------------------|---------|
| GET    | /reports/daily               | OWNER   |
| GET    | /reports/sales-by-waiter     | OWNER   |
| GET    | /reports/sales-by-product    | OWNER   |
| GET    | /reports/summary             | OWNER   |

### Users
| Method | Endpoint              | Access  |
|--------|-----------------------|---------|
| GET    | /users                | OWNER   |
| POST   | /users                | OWNER   |
| PUT    | /users/:id            | OWNER   |
| PATCH  | /users/:id/status     | OWNER   |

### Daily Audit
| Method | Endpoint              | Access  |
|--------|-----------------------|---------|
| GET    | /daily-audit          | OWNER   |
| POST   | /daily-audit/close    | OWNER   |

---

## Running Tests

```bash
cd backend
npm test
```

Tests require a running PostgreSQL instance (uses the DATABASE_URL from .env).

Tests cover:
- Login (valid, invalid, inactive user)
- Waiter creates sale with server-side price calculation
- Inactive product cannot be sold
- Owner cannot create a sale
- Waiter only sees own sales
- Owner sees all sales
- Waiter cannot verify/dispute
- Owner can verify a sale
- Verified sale cannot be re-verified
- Dispute requires a note
- Historical price preserved after product price change
- Closed day cannot be closed twice

---

## Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import into Vercel
3. Set environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend → Render / Railway

1. Push `backend/` to GitHub
2. Create a new Web Service
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your_production_secret
   CLIENT_URL=https://your-frontend.vercel.app
   NODE_ENV=production
   ```

### Database → Neon / Supabase / Railway PostgreSQL

1. Create a PostgreSQL database
2. Copy the connection string to `DATABASE_URL`
3. Run migration: `node migrations/migrate.js`
4. Run seed (development only): `node seeds/seed.js`

### CORS for Production

In `backend/src/app.js`, the CORS origin is set from `process.env.CLIENT_URL`.
Set this to your exact Vercel URL, e.g.:
```
CLIENT_URL=https://yohanan-coffee.vercel.app
```

---

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT secret must be a long random string (32+ characters) in production
- All SQL uses parameterized queries (no SQL injection risk)
- Backend never trusts `waiter_id`, `price`, `total_amount`, or `status` from the frontend
- Helmet sets secure HTTP headers
- `.env` files are never committed (add to `.gitignore`)

---

## Business Rules Enforced

1. Waiters can only create sales for themselves (waiter_id from JWT)
2. Price is always read from the database at sale creation time
3. Historical `unit_price` is never recalculated
4. Only PENDING sales can be audited
5. A VERIFIED sale cannot be changed back to PENDING
6. Every audit creates an immutable `audit_records` row
7. Disputes require a written note
8. Waiters cannot see other waiters' sales
9. Closing a day twice returns an error
10. All timestamps use server time
