# Development Workflow

### Prerequisites
```bash
# Required software (already installed per user)
# - Node.js 18+
# - Golang 1.21+
# - MySQL 8.0+
# - LiveKit Server executable (livekit-server.exe)
# - PNPM package manager
```

### Development Commands
```bash
# Start all services (from project root)
./scripts/start-services.sh

# Or start services individually:
pnpm dev                              # Start frontend
cd backend && go run cmd/server/main.go  # Start backend
livekit-server --dev --bind 0.0.0.0 --port 7880  # Start LiveKit server
```

### Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
NEXT_PUBLIC_APP_ENV=development

# Backend (.env)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=livekit_gaming

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_HOST=localhost:7880

PORT=8080
GIN_MODE=debug
```

---

*This fullstack architecture document serves as the comprehensive blueprint for implementing gaming voice chat features on top of the existing LiveKit Meet infrastructure. All development should follow these patterns and constraints to ensure successful integration and maintainable code.*