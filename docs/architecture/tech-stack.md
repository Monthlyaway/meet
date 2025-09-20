# Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.9.2 | Type-safe frontend development | Already established in existing codebase |
| Frontend Framework | Next.js | 15.2.4 | React-based web application | Existing framework, proven App Router patterns |
| UI Component Library | LiveKit Components React | 2.9.14 | Voice/video UI components | Existing integration, proven voice chat UI |
| State Management | React useState/Context | Built-in | Local component state management | Simple state needs, no complex gaming state |
| Backend Language | Go | 1.21+ | Backend service development | Installed on Windows, excellent performance |
| Backend Framework | Gin | 1.9+ | HTTP web framework for Go | Popular, simple REST API framework |
| API Style | REST | HTTP/1.1 | Client-server communication | Simple request/response for basic features |
| Database | MySQL | 8.0+ | User and room data persistence | Installed on Windows, reliable relational DB |
| Cache | None | N/A | No caching layer needed | Simple application, local development |
| File Storage | Local filesystem | N/A | Static assets and uploads | Local development, no cloud storage |
| Authentication | JWT | Go-JWT v4 | Stateless user authentication | Simple token-based auth for REST APIs |
| Frontend Testing | Vitest | 3.2.4 | Unit testing for React components | Already configured in existing project |
| Backend Testing | Go testing | Built-in | Unit testing for Go services | Standard Go testing framework |
| E2E Testing | None | N/A | No E2E testing initially | Keep development simple |
| Build Tool | Next.js | 15.2.4 | Frontend build and dev server | Existing build configuration |
| Bundler | Webpack | Built-in | Module bundling via Next.js | Next.js default, already configured |
| IaC Tool | None | N/A | No infrastructure as code | Local development only |
| CI/CD | None | N/A | No continuous deployment | Local development environment |
| Monitoring | Console logging | Built-in | Basic application logging | Simple console output for debugging |
| Logging | Standard library | Built-in | Go log package for backend | Basic logging for local development |
| CSS Framework | CSS Modules | Built-in | Component-scoped styling | Existing pattern in LiveKit Meet |
| Voice/Video | LiveKit Server | 1.5+ | Local WebRTC infrastructure | Local livekit-server.exe for voice chat |
| Database Driver | go-sql-driver/mysql | 1.7+ | MySQL connectivity for Go | Standard MySQL driver for Go |
| ORM Framework | GORM | 1.25+ | Object-relational mapping | Simplified database operations and migrations |
| HTTP Router | Gin Router | Built-in | REST API routing | Part of Gin framework |
| CORS Handler | Gin CORS | 1.4+ | Cross-origin request handling | Enable frontend-backend communication |
| Environment Config | godotenv | 1.4+ | Environment variable management | Simple .env file handling for Go |
