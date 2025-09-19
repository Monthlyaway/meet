# Unified Project Structure

```plaintext
livekit-meet-gaming/                  # Extended existing repository
├── .github/                          # Existing CI/CD workflows (preserved)
├── app/                              # Next.js App Router (existing, extended)
│   ├── (auth)/                       # New authentication route group
│   ├── api/                          # Existing Next.js API routes (preserved)
│   ├── rooms/                        # Extended room functionality
│   ├── layout.tsx                    # Root layout (extended with auth)
│   └── page.tsx                      # Home page (enhanced for gaming)
├── backend/                          # New Golang backend service
│   ├── cmd/server/main.go           # Golang application entry point
│   ├── internal/                    # Internal packages
│   │   ├── handlers/                # HTTP request handlers
│   │   ├── services/               # Business logic layer
│   │   ├── repositories/           # Data access layer
│   │   ├── models/                 # Data models
│   │   ├── middleware/             # HTTP middleware
│   │   └── config/                # Configuration
│   ├── scripts/                    # Database and setup scripts
│   ├── .env.example               # Backend environment template
│   ├── go.mod                     # Go module definition
│   └── go.sum                     # Go module checksums
├── lib/                             # Extended existing utilities
│   ├── auth/                       # New authentication utilities
│   ├── gaming/                     # New gaming components
│   ├── api/                        # New API integration
│   └── (existing LiveKit components preserved)
├── docs/                           # Documentation
│   ├── prd.md                     # Gaming enhancement PRD
│   ├── brownfield-architecture.md # Existing system analysis
│   └── architecture.md           # This fullstack architecture
├── scripts/                        # Build and development scripts
├── .env.example                    # Frontend environment template
├── package.json                    # Frontend dependencies (existing)
└── README.md                       # Updated project documentation
```
