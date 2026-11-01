# BHAIRAVI Creations

> Handcrafted & Precision 3D-Printed Creations — Ludhiana, Punjab, India.

A full-stack, zero-framework digital commerce platform, secure backend, admin dashboard, product/enquiry analytics, and exportable business intelligence engine.

---

## Tech Stack

- **Runtime & Language**: Node.js (v20+ ESM) + TypeScript 5.6 via `tsx`
- **Backend & Web Server**: Native Node.js `node:http` (zero framework dependencies) with timing-safe `node:crypto` scrypt/PBKDF2 auth, daily-salted SHA-256 IP hashing, and 20MB stream ceiling
- **Database**: SQLite 3 via `better-sqlite3` in WAL mode with transactional schema migrations
- **Frontend**: Server-Side Rendered (SSR) semantic HTML5 templates, CSS Custom Properties with flexbox/grid layouts, micro-animations, and vanilla JavaScript telemetry beacon (`navigator.sendBeacon`)
- **Testing**: Vitest + comprehensive E2E test suites

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Run Migrations & Seed Catalog
```bash
npm run migrate:up
npm run seed
```

### 4. Start the Application
```bash
npx tsx src/server/index.ts
```
The server will start listening at `http://127.0.0.1:4001/`.

---

## Key Routes

- **Storefront Home**: `/`
- **Catalog**: `/products`
- **Product Detail**: `/products/:slug`
- **Custom Order Enquiry**: `/custom-order`
- **Admin Portal**: `/admin`
  - Default Username: `bhairavi_admin`
  - Default Password: `ChangeMeImmediately123!`

---

## License

Private & Proprietary — BHAIRAVI Creations, Ludhiana, Punjab.
