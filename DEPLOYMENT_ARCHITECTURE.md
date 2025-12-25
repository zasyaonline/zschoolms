# Deployment Architecture - ZSchool Management System

## Current Setup (Local Development)

```
┌─────────────────────────────────────────────────────────────┐
│                      Local Development                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vite)               Backend (Express)             │
│  ┌────────────────┐           ┌──────────────────┐          │
│  │  React App     │           │   Node.js API    │          │
│  │  localhost:5173│◄─────────►│  localhost:5001  │          │
│  │                │   CORS    │                  │          │
│  └────────────────┘           └────────┬─────────┘          │
│                                        │                     │
│                                        ▼                     │
│                              ┌──────────────────┐            │
│                              │   PostgreSQL DB  │            │
│                              │   63.250.52.24   │            │
│                              └──────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Target Setup (Production/Test Environment)

```
┌──────────────────────────────────────────────────────────────────┐
│                    Internet (Public Access)                       │
└──────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────────┐
│   Netlify CDN       │           │   Render Web Service    │
│  (Frontend Host)    │           │   (Backend Host)        │
├─────────────────────┤           ├─────────────────────────┤
│                     │           │                         │
│  React Static App   │           │  Node.js Express API    │
│  *.netlify.app      │◄─────────►│  *.onrender.com        │
│                     │   HTTPS   │                         │
│  • HTML/CSS/JS      │   CORS    │  • REST API             │
│  • React Router     │           │  • JWT Auth             │
│  • Vite Build       │           │  • File Upload          │
│                     │           │  • Email Service        │
└─────────────────────┘           └──────────┬──────────────┘
                                             │
                                             │ SSL/TLS
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │  Render PostgreSQL       │
                              │  (Managed Database)      │
                              ├──────────────────────────┤
                              │  • User Data             │
                              │  • Student Records       │
                              │  • Attendance            │
                              │  • Marks & Reports       │
                              │  • Audit Logs            │
                              └──────────────────────────┘
```

## Deployment Flow

```
┌─────────────┐
│  Developer  │
│   (Local)   │
└──────┬──────┘
       │ git push
       ▼
┌──────────────────┐
│     GitHub       │
│   (Repository)   │
└────┬─────────┬───┘
     │         │
     │ webhook │ webhook
     │         │
     ▼         ▼
┌─────────┐  ┌──────────┐
│ Netlify │  │  Render  │
│  Build  │  │  Build   │
└────┬────┘  └────┬─────┘
     │            │
     │ deploy     │ deploy
     ▼            ▼
┌─────────┐  ┌──────────┐
│Frontend │  │ Backend  │
│  Live   │  │   Live   │
└─────────┘  └──────────┘
```

## Data Flow

```
┌──────────┐
│  User    │
│ Browser  │
└────┬─────┘
     │
     │ 1. Visit site
     ▼
┌────────────────┐
│ Netlify CDN    │
│ (Static Files) │
└────┬───────────┘
     │
     │ 2. React loads
     │ 3. User clicks login
     ▼
┌────────────────┐
│ Render Backend │◄────┐
│ (API Server)   │     │
└────┬───────────┘     │
     │                 │
     │ 4. Verify       │ 6. Send token
     │    credentials  │    & user data
     ▼                 │
┌────────────────┐     │
│  PostgreSQL    │     │
│   Database     │     │
└────────────────┘     │
                       │
     ┌─────────────────┘
     │
     │ 7. Store token
     ▼
┌──────────────┐
│  User        │
│  Dashboard   │
└──────────────┘
```

## Environment Variables Flow

### Frontend (Netlify)
```
Netlify Dashboard
    │
    │ Environment Variables
    ▼
┌─────────────────────────────┐
│ VITE_API_BASE_URL           │──┐
│ = https://backend.onrender  │  │
└─────────────────────────────┘  │
                                 │
    ┌────────────────────────────┘
    │ Build time injection
    ▼
┌─────────────────────────────┐
│  Compiled React App         │
│  (Static files)             │
└─────────────────────────────┘
```

### Backend (Render)
```
Render Dashboard
    │
    │ Environment Variables
    ▼
┌─────────────────────────────┐
│ DATABASE_URL                │
│ JWT_SECRET                  │
│ FRONTEND_URL                │
│ etc...                      │
└──────────┬──────────────────┘
           │
           │ Runtime access
           ▼
┌─────────────────────────────┐
│  Node.js Process            │
│  (Express Server)           │
└─────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────┐
│           Security Layers                │
├─────────────────────────────────────────┤
│                                          │
│  1. HTTPS/TLS (All Traffic Encrypted)   │
│     ├─ Netlify: Auto SSL               │
│     └─ Render: Auto SSL                │
│                                          │
│  2. CORS (Cross-Origin Protection)      │
│     └─ Backend allows Netlify domain   │
│                                          │
│  3. JWT Authentication                  │
│     ├─ Access Token (1 hour)           │
│     └─ Refresh Token (7 days)          │
│                                          │
│  4. Database Security                   │
│     ├─ SSL Connection                  │
│     ├─ Password Protected              │
│     └─ Firewall Rules                  │
│                                          │
│  5. Rate Limiting                       │
│     └─ API request throttling          │
│                                          │
│  6. Input Validation                    │
│     ├─ Frontend: Yup schemas           │
│     └─ Backend: Express validator      │
│                                          │
│  7. XSS Protection                      │
│     ├─ DOMPurify (Frontend)            │
│     └─ Helmet.js (Backend)             │
│                                          │
└─────────────────────────────────────────┘
```

## Cost Breakdown (Free Tier)

```
Service          Cost    Limitations
──────────────────────────────────────────
Netlify          FREE    • 100GB bandwidth/mo
(Frontend)               • 300 build min/mo
                        • Auto SSL
                        • CDN included

Render           FREE    • 750 hours/mo
(Backend)               • Sleeps after 15min
                        • 512MB RAM
                        • Slower builds

Render           FREE    • 1GB storage
(Database)              • 90 days expiry
                        • Shared CPU
                        • Daily backups
──────────────────────────────────────────
TOTAL            $0/mo   Perfect for testing!
```

## Upgrade Path (Production)

```
Service          Cost        Benefits
─────────────────────────────────────────────
Netlify Pro      $19/mo     • Priority builds
                            • More bandwidth
                            • Analytics

Render Starter   $7/mo      • Always on
(Backend)                   • 512MB RAM
                            • Faster builds

Render Standard  $7/mo      • Persistent storage
(Database)                  • 1GB RAM
                            • No expiry
─────────────────────────────────────────────
TOTAL            $33/mo     Production ready
```

## Monitoring & Logs

```
┌────────────────────────────────────┐
│       Monitoring Dashboard         │
├────────────────────────────────────┤
│                                    │
│  Netlify                           │
│  ├─ Deploy Logs                   │
│  ├─ Build Times                   │
│  ├─ Function Logs                 │
│  └─ Bandwidth Usage               │
│                                    │
│  Render                            │
│  ├─ Application Logs              │
│  ├─ Database Metrics              │
│  ├─ CPU/Memory Usage              │
│  └─ Error Tracking                │
│                                    │
│  Browser DevTools                  │
│  ├─ Console Logs                  │
│  ├─ Network Tab                   │
│  └─ Performance Metrics           │
│                                    │
└────────────────────────────────────┘
```

## Backup Strategy

```
┌─────────────────────────────────────┐
│        Backup Strategy              │
├─────────────────────────────────────┤
│                                     │
│  Code Repository                    │
│  ├─ GitHub (Primary)                │
│  ├─ Automatic backups               │
│  └─ Version control                 │
│                                     │
│  Database                           │
│  ├─ Render: Daily auto backup       │
│  ├─ Manual: pg_dump exports         │
│  └─ Store: S3 or Google Drive       │
│                                     │
│  Environment Variables              │
│  ├─ .deployment-secrets.txt         │
│  ├─ Keep secure offline copy        │
│  └─ 1Password / LastPass            │
│                                     │
└─────────────────────────────────────┘
```

---

**Legend:**
- `┌─┐` = Container/Service
- `◄──►` = Two-way communication
- `──►` = One-way flow
- `│` = Connection/Flow
- `▼` = Direction of flow
