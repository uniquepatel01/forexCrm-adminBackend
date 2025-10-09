# Sales CRM Admin Backend

A Node.js/Express backend for multi-CRM lead management with role-based access.

## Key Features

- **Multi-CRM Support:** Dynamic MongoDB connections for Forex, Gold, etc.
- **Roles:** SuperAdmin, Admin, Agent (JWT authentication)
- **Lead Management:** Create, update, assign, bulk upload, CSV import
- **Status Buckets:** Custom lead statuses per CRM
- **Business Types & Volumes:** Configurable per CRM
- **Dashboard & Reports:** Analytics endpoints for leads and agents
- **Agent Management:** Block, trash, update, view leads

## Main Endpoints

- `/api/admin/*` — Admin login, profile, update
- `/api/agent/*` — Agent login, register, leads, block/trash
- `/api/crm/*` — Lead CRUD, bulk upload, dropdowns
- `/api/dashboard/*` — Top buckets, converted/demo stats
- `/api/reports/*` — Today/weekly/monthly/yearly reports
- `/api/upload/csv` — CSV lead upload (admin only)
- `/api/*` — SuperAdmin: login, register admin, CRM config
- `/apk/*` — Agent APK endpoints

## Setup

1. Add your MongoDB URIs and JWT secret to `.env`
2. Install dependencies:  
   `npm install`
3. Seed SuperAdmin (optional):  
   `node seedSuperadmin.js`
4. Start server:  
   `npm run dev`

## Structure

- `server.js` — Entry point
- `models/` — Mongoose schemas
- `controllers/` — Business logic
- `routes/` — API routes
- `config/` — DB connection logic

---

**For details, see route/controller files.**