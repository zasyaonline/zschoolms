# ZSchool Management System

A comprehensive school management system with React frontend and Node.js backend.

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend** | https://zschoolms-app.netlify.app |
| **Backend** | https://zschoolms-backend.onrender.com |
| **API Docs** | https://zschoolms-backend.onrender.com/api-docs |

**Admin Login**: admin@zschool.com / Admin@123

## 🚀 Quick Start

```bash
# Use Node 18.20.5
nvm use 18.20.5

# Install dependencies
npm install

# Run both servers
npm run dev

# Or separately:
npm run dev:backend   # Port 5001
npm run dev:frontend  # Port 5173
```

## 📚 Documentation

**📖 Complete Project Reference**: [ZSCHOOL_PROJECT_REFERENCE.md](ZSCHOOL_PROJECT_REFERENCE.md)

This consolidated document contains:
- Architecture & tech stack
- Database schema (18 tables, 14 migrations)
- API reference (70+ endpoints)
- Security & access control (RBAC, MFA, immutability)
- Business workflows (marks, report cards, sponsorship)
- Development guide
- Troubleshooting

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, React Router 7 |
| Backend | Node.js 18, Express 4, Sequelize |
| Database | PostgreSQL 15 |
| Storage | AWS S3 (AES-256) |
| Email | Zeptomail SMTP |
| Auth | JWT + MFA |

## 📁 Project Structure

```
zschoolms/
├── frontend/           # React Vite app (29 pages)
├── backend/            # Express API (70+ endpoints)
│   ├── src/
│   │   ├── models/     # 18 Sequelize models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── jobs/       # Background cron jobs
│   └── migrations/     # 14 SQL migrations
└── shared/             # Shared utilities
```

## 🔐 Key Features

- **Role-Based Access Control**: Super Admin, Principal, Admin, Teacher, Student, Sponsor
- **MFA**: Mandatory for admin roles (email OTP)
- **Immutable Records**: Database triggers prevent modification of approved marks/report cards
- **Digital Signatures**: Principal signs report cards with certificate
- **Automated Workflows**: Sponsorship renewal reminders, email distribution

## 📊 Current Data

| Entity | Count |
|--------|-------|
| Students | 114 |
| Teachers | 15 |
| Sponsors | 71 |
| Marksheets | 9,254 |

## 🗂️ Database

```
Host: 63.250.52.24
Port: 5432
Database: zschool_db
User: zschool_user
```

---

**Last Updated**: December 27, 2025

For complete documentation, see **[ZSCHOOL_PROJECT_REFERENCE.md](ZSCHOOL_PROJECT_REFERENCE.md)**
