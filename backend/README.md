# Backend Development README

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The server will start on http://localhost:5000
```

## Environment Configuration

Copy `.env.example` to `.env` and configure your database:

```bash
cp .env.example .env
```

Required environment variables:
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   └── sequelize.config.js
│   ├── controllers/      # Request handlers
│   ├── models/          # Database models (Sequelize)
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.js         # Entry point
├── tests/               # Test files
├── uploads/            # File uploads
├── .env                # Environment variables
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## API Endpoints

Base URL: `http://localhost:5000/api`

### Health Check
- `GET /api/health` - Server health status

### Coming Soon (based on documentation)
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/students` - Student management
- `/api/schools` - School configuration
- `/api/grades` - Grading system
- `/api/attendance` - Attendance tracking
- `/api/marks` - Marks management

## Database

Using PostgreSQL with Sequelize ORM.

Connection configured in `src/config/database.js`

## Development Notes

- Server runs on port 5000 by default
- Frontend should run on port 5173
- CORS enabled for frontend URL
- Request logging with Morgan
- Security headers with Helmet
