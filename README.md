# EduTrack — Student Management System (Supabase Edition)

## Stack
- **Frontend:** Vanilla HTML / CSS / JS (unchanged)
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth + custom JWT

---

## Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Go to **SQL Editor** and run the entire contents of `supabase-schema.sql`
3. Copy your **Project URL** and **Service Role Key** from:
   Settings → API → Project URL / service_role key

### 2. Configure Backend
Edit `backend/.env`:
```
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your_long_random_secret_change_this
ADMIN_SECRET_KEY=your_admin_registration_secret
FRONTEND_ORIGIN=*
```

### 3. Install & Run
```bash
cd backend
npm install
npm run dev
```
Open http://localhost:5000

---

## Auth API

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register/admin` | POST | Register admin (requires `x-admin-secret` header) |
| `/api/auth/register/student` | POST | Student self-registration |
| `/api/auth/login` | POST | Login for both roles (email + password) |
| `/api/auth/logout` | POST | Logout |

### Register Admin
```bash
curl -X POST http://localhost:5000/api/auth/register/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_registration_secret" \
  -d '{"name":"Admin","email":"admin@school.com","password":"Admin@123"}'
```

### Register Student
```bash
curl -X POST http://localhost:5000/api/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@school.com","password":"John@123","rollNumber":"CS001","course":"B.Tech","phone":"9876543210"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"Admin@123"}'
```

---

## Project Structure
```
├── supabase-schema.sql       ← Run this in Supabase SQL Editor first
├── backend/
│   ├── config/supabase.js    ← Supabase client
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   └── announcementController.js
│   ├── middleware/auth.js     ← JWT verification (unchanged)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   └── announcementRoutes.js
│   ├── server.js
│   ├── .env                  ← Fill in your Supabase credentials
│   └── package.json
└── frontend/                 ← Unchanged except index.html + shared.js
    ├── index.html            ← Login + Register page
    ├── js/shared.js          ← Updated API endpoints
    └── pages/                ← All other pages unchanged
```
