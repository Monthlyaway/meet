# Core Workflows

### User Registration and Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as Gin Backend
    participant DB as MySQL Database

    User->>Frontend: Fill registration form
    Frontend->>Backend: POST /api/auth/register
    Backend->>Backend: Validate input & hash password
    Backend->>DB: INSERT user record
    DB-->>Backend: User created
    Backend->>Backend: Generate JWT token
    Backend-->>Frontend: {user, token}
    Frontend->>Frontend: Store JWT in localStorage
    Frontend-->>User: Registration successful
```

### Room Creation and Token Sharing Flow

```mermaid
sequenceDiagram
    participant Creator as Room Creator
    participant Frontend as Next.js Frontend
    participant Backend as Gin Backend
    participant DB as MySQL Database
    participant LK as LiveKit Server

    Creator->>Frontend: Create room form
    Frontend->>Backend: POST /api/rooms (with JWT)
    Backend->>Backend: Validate JWT & generate UUID token
    Backend->>DB: INSERT room with token
    Backend->>DB: INSERT main lobby channel
    Backend->>LK: Create LiveKit room for main lobby
    Backend-->>Frontend: {room, accessToken}
    Frontend-->>Creator: Display access token
    Note over Creator: Creator shares token with friends
```

### Room Joining and Voice Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as Gin Backend
    participant DB as MySQL Database
    participant LK as LiveKit Server

    User->>Frontend: Enter access token
    Frontend->>Backend: POST /api/rooms/join (with token & JWT)
    Backend->>DB: FIND room by access_token
    Backend->>DB: INSERT room membership
    Backend->>Backend: Generate LiveKit token for main lobby
    Backend-->>Frontend: {room, channels, livekitToken}
    Frontend->>LK: Connect to main lobby with token
    LK-->>Frontend: Voice connection established
    Frontend-->>User: Joined main lobby successfully
```

### Channel Switching Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant Backend as Gin Backend
    participant DB as MySQL Database
    participant LK as LiveKit Server

    User->>Frontend: Click different channel
    Frontend->>Backend: POST /api/channels/{id}/join (with JWT)
    Backend->>DB: VALIDATE user is room member
    Backend->>DB: UPDATE user current channel
    Backend->>Backend: Generate new LiveKit token for target channel
    Backend-->>Frontend: {channel, livekitToken}
    Frontend->>LK: Disconnect from current channel
    Frontend->>LK: Connect to new channel with token
    LK-->>Frontend: Voice connection in new channel
    Frontend-->>User: Channel switched successfully
```

### Team Channel Creation Flow (Admin Only)

```mermaid
sequenceDiagram
    participant Admin as Room Admin
    participant Frontend as Next.js Frontend
    participant Backend as Gin Backend
    participant DB as MySQL Database
    participant LK as LiveKit Server

    Admin->>Frontend: Create team channel form
    Frontend->>Backend: POST /api/rooms/{id}/channels (with JWT)
    Backend->>DB: VALIDATE user is room creator
    Backend->>DB: CHECK channel name unique in room
    Backend->>DB: INSERT new channel
    Backend->>LK: Create corresponding LiveKit room
    Backend-->>Frontend: {channel}
    Frontend->>Frontend: Update channel list display
    Frontend-->>Admin: Team channel created
```
