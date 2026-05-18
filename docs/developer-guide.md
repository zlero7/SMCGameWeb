# Developer Guide

## Quick Start

### Development Environment
```bash
# Clone and setup
cd Desktop/GameWeb

# Start all services with Docker
docker-compose up -d

# Or local development:
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```

### Database Setup
```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

## Project Structure

```
GameWeb/
├── frontend/           # React + Vite
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── pages/admin/ # Admin panel
│   │   ├── context/   # React Context
│   │   └── services/  # API calls
│   ├── tests/         # Unit tests
│   └── e2e/          # Playwright tests
├── backend/           # Express + Prisma
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── middleware/ # Auth middleware
│   │   └── index.js  # Main server
│   └── tests/        # Unit tests
└── prisma/           # Database schema
```

## API Reference

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notices | List notices |
| GET | /api/careers | List careers |
| GET | /api/admissions | List admissions |
| GET | /api/calendar | List calendar events |
| GET | /api/calendar/ics | Export ICS |
| GET | /api/assignments | List assignments |

### Authenticated Endpoints (Bearer Token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/notices | Create notice |
| PUT | /api/notices/:id | Update notice |
| DELETE | /api/notices/:id | Delete notice |
| (same pattern for other entities) |

## Testing

### Unit Tests
```bash
# Frontend
cd frontend && npm run test

# Backend
cd backend && npm run test
```

### E2E Tests
```bash
cd frontend
npx playwright test
```

### Coverage
```bash
cd frontend && npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
1. Check Docker is running
2. Verify DATABASE_URL in .env
3. Run `npx prisma db push` again

### CORS Errors
Make sure backend CORS is configured for your frontend URL.

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :4000

# Kill process
taskkill /PID <pid> /F
```
