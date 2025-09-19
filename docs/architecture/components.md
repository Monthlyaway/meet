# Components

### Frontend Components

#### Authentication Component
**Responsibility:** Handle user registration, login, and authentication state management for the gaming platform

**Key Interfaces:**
- `/auth/login` - Login form with email/password validation
- `/auth/register` - Registration form with username/email/password
- `useAuth()` - React hook for authentication state and operations

**Dependencies:**
- Golang backend REST API for authentication endpoints
- React Context for global auth state
- Next.js router for authentication redirects

**Technology Stack:** React functional components, TypeScript, Next.js App Router, JWT token storage in localStorage

#### Room Management Component
**Responsibility:** Handle gaming room creation, token sharing, and room joining functionality

**Key Interfaces:**
- `/rooms/create` - Room creation form with name input
- `/rooms/join` - Token input form for room joining
- `useRoom()` - React hook for current room state and operations

**Dependencies:**
- Authentication Component for user context
- Golang backend API for room operations
- Channel Navigation Component for room display

**Technology Stack:** React components, TypeScript interfaces, REST API integration, form validation

#### Channel Navigation Component
**Responsibility:** Display room hierarchy and handle voice channel switching within gaming rooms

**Key Interfaces:**
- Channel list sidebar with main lobby and team channels
- Channel switching buttons with real-time user indicators
- Admin controls for team channel creation (room creators only)

**Dependencies:**
- Room Management Component for current room context
- LiveKit Components for voice connection state
- Golang backend API for channel operations

**Technology Stack:** React components, LiveKit React hooks, CSS modules for styling

#### LiveKit Integration Component
**Responsibility:** Manage voice/video communication using existing LiveKit patterns extended for channel-based rooms

**Key Interfaces:**
- Voice connection management per channel
- LiveKit token handling from backend
- Audio controls and participant display

**Dependencies:**
- Existing LiveKit Meet components (preserved)
- Channel Navigation Component for channel switching
- Local LiveKit server for voice communication

**Technology Stack:** Existing LiveKit Components React, LiveKit Client SDK, extended with channel context

### Backend Components

#### Authentication Service
**Responsibility:** Handle user registration, login, JWT token generation and validation

**Key Interfaces:**
- `POST /api/auth/register` - User registration with password hashing
- `POST /api/auth/login` - User authentication with JWT generation
- `AuthMiddleware()` - JWT token validation for protected routes

**Dependencies:**
- MySQL database for user storage
- bcrypt for password hashing
- JWT library for token operations

**Technology Stack:** Gin HTTP handlers, go-jwt library, bcrypt, MySQL driver

#### Room Management Service
**Responsibility:** Handle gaming room creation, access token generation, and room membership management

**Key Interfaces:**
- `POST /api/rooms` - Create room with UUID token generation
- `POST /api/rooms/join` - Join room using access token
- `RoomRepository` - Database operations for room entities

**Dependencies:**
- Authentication Service for user validation
- MySQL database for room persistence
- UUID library for token generation
- LiveKit Service for room coordination

**Technology Stack:** Gin HTTP handlers, MySQL database operations, UUID generation, repository pattern

#### Channel Management Service
**Responsibility:** Handle team channel creation, channel switching, and LiveKit room coordination

**Key Interfaces:**
- `POST /api/rooms/{id}/channels` - Create team channels (admin only)
- `POST /api/channels/{id}/join` - Switch user between channels
- `ChannelRepository` - Database operations for channel entities

**Dependencies:**
- Room Management Service for room validation
- LiveKit Service for voice room management
- MySQL database for channel persistence

**Technology Stack:** Gin HTTP handlers, database repository pattern, LiveKit integration

#### LiveKit Service
**Responsibility:** Interface with local LiveKit server for voice room management and token generation

**Key Interfaces:**
- `CreateLiveKitRoom()` - Create voice rooms for channels
- `GenerateLiveKitToken()` - Generate access tokens for voice participation
- `ManageParticipant()` - Handle user voice connection state

**Dependencies:**
- Local LiveKit server (livekit-server.exe)
- LiveKit Server SDK for Go
- Channel Management Service for room mapping

**Technology Stack:** LiveKit Server SDK, Go HTTP client, local server integration
