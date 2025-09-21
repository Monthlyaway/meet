# Chapter 17: Code Analysis - API Layer

The API layer is the bridge between our frontend and LiveKit servers. It handles authentication, security, and server-side logic. Let's analyze how our Next.js API routes work.

## API Route Overview

**Location**: `app/api/connection-details/route.ts`
**Purpose**: Generate secure tokens for LiveKit room access
**HTTP Method**: GET
**URL**: `/api/connection-details?roomName=abc&participantName=John`

## Complete Code Analysis

### 1. Environment Setup and Security

```tsx
// app/api/connection-details/route.ts:7-9
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
```

**Environment variables**:
- `LIVEKIT_API_KEY`: Public identifier for your LiveKit project
- `LIVEKIT_API_SECRET`: Secret key for signing tokens (never exposed to frontend)
- `LIVEKIT_URL`: Your LiveKit server URL (e.g., `wss://myproject.livekit.cloud`)

**Security principle**: Secrets stay on the server, never sent to the browser.

### 2. Request Parameter Parsing

```tsx
// app/api/connection-details/route.ts:15-19
const roomName = request.nextUrl.searchParams.get('roomName');
const participantName = request.nextUrl.searchParams.get('participantName');
const metadata = request.nextUrl.searchParams.get('metadata') ?? '';
const region = request.nextUrl.searchParams.get('region');
```

**URL structure example**:
```
/api/connection-details?roomName=my-meeting&participantName=John&region=us-west
```

**Parameter validation**:
```tsx
// app/api/connection-details/route.ts:29-34
if (typeof roomName !== 'string') {
  return new NextResponse('Missing required query parameter: roomName', { status: 400 });
}
if (participantName === null) {
  return new NextResponse('Missing required query parameter: participantName', { status: 400 });
}
```

**HTTP status codes**:
- `400 Bad Request`: Client sent invalid data
- `500 Internal Server Error`: Server-side problems
- `200 OK`: Success (implicit)

### 3. Regional Server Selection

```tsx
// app/api/connection-details/route.ts:20-27
if (!LIVEKIT_URL) {
  throw new Error('LIVEKIT_URL is not defined');
}
const livekitServerUrl = region ? getLiveKitURL(LIVEKIT_URL, region) : LIVEKIT_URL;

if (livekitServerUrl === undefined) {
  throw new Error('Invalid region');
}
```

**Region handling**:
- **No region specified**: Use default server
- **Region specified**: Route to regional server for lower latency
- **Invalid region**: Return error

**Example regions**: `us-west`, `us-east`, `eu-central`, `ap-southeast`

### 4. Participant Identity Management

```tsx
// app/api/connection-details/route.ts:36-47
let randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value;

if (!randomParticipantPostfix) {
  randomParticipantPostfix = randomString(4);
}

const participantToken = await createParticipantToken(
  {
    identity: `${participantName}__${randomParticipantPostfix}`,
    name: participantName,
    metadata,
  },
  roomName,
);
```

**Identity system**:
- **Display name**: What users see ("John")
- **Unique identity**: Internal identifier ("John__abc4")
- **Cookie persistence**: Same user gets same postfix across sessions

**Why unique identities matter**:
- Prevents conflicts when multiple "John"s join
- Enables reconnection to same participant
- Supports user management and moderation

### 5. JWT Token Generation

```tsx
// app/api/connection-details/route.ts:69-81
function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m'; // Token expires in 5 minutes

  const grant: VideoGrant = {
    room: roomName,           // Which room they can join
    roomJoin: true,           // Permission to join
    canPublish: true,         // Can send audio/video
    canPublishData: true,     // Can send chat messages
    canSubscribe: true,       // Can receive audio/video
  };

  at.addGrant(grant);
  return at.toJwt();
}
```

**JWT (JSON Web Token) structure**:
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "your-api-key",
    "sub": "John__abc4",
    "exp": 1634567890,
    "video": {
      "room": "my-meeting",
      "roomJoin": true,
      "canPublish": true,
      "canPublishData": true,
      "canSubscribe": true
    }
  },
  "signature": "encrypted-signature"
}
```

**Security features**:
- **Expiration**: Token automatically expires (5 minutes)
- **Room scoping**: Only valid for specific room
- **Permission control**: Granular access control
- **Tamper proof**: Signature prevents modification

### 6. Response and Cookie Management

```tsx
// app/api/connection-details/route.ts:49-61
const data: ConnectionDetails = {
  serverUrl: livekitServerUrl,
  roomName: roomName,
  participantToken: participantToken,
  participantName: participantName,
};

return new NextResponse(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Set-Cookie': `${COOKIE_KEY}=${randomParticipantPostfix}; Path=/; HttpOnly; SameSite=Strict; Secure; Expires=${getCookieExpirationTime()}`,
  },
});
```

**Response data structure**:
```typescript
// lib/types.ts:23-28
export type ConnectionDetails = {
  serverUrl: string;        // wss://myproject.livekit.cloud
  roomName: string;         // my-meeting
  participantName: string;  // John
  participantToken: string; // eyJ0eXAiOiJKV1QiLCJhbGc...
};
```

**Cookie security flags**:
- `HttpOnly`: JavaScript can't access (XSS protection)
- `SameSite=Strict`: Only sent with same-site requests (CSRF protection)
- `Secure`: Only sent over HTTPS
- `Path=/`: Available across entire site

### 7. Cookie Expiration Logic

```tsx
// app/api/connection-details/route.ts:83-89
function getCookieExpirationTime(): string {
  var now = new Date();
  var time = now.getTime();
  var expireTime = time + 60 * 120 * 1000; // 2 hours
  now.setTime(expireTime);
  return now.toUTCString();
}
```

**Time calculation**:
- `60 * 120 * 1000` = 2 hours in milliseconds
- Cookie expires after 2 hours of inactivity
- User gets new random postfix after expiration

## API Security Architecture

### 1. Authentication Flow

```
Frontend Request
  ↓
API Route validates parameters
  ↓
Server generates JWT with API_SECRET
  ↓
JWT sent to frontend
  ↓
Frontend connects to LiveKit with JWT
  ↓
LiveKit validates JWT with API_SECRET
  ↓
Connection established if valid
```

### 2. Token Permissions

The `VideoGrant` object controls what users can do:

```tsx
const grant: VideoGrant = {
  room: roomName,           // Room restriction
  roomJoin: true,           // Can join room
  roomList: false,          // Cannot list all rooms
  roomRecord: false,        // Cannot start recording
  roomAdmin: false,         // Cannot kick participants
  canPublish: true,         // Can send media
  canSubscribe: true,       // Can receive media
  canPublishData: true,     // Can send chat
  canSubscribeData: true,   // Can receive chat
  canUpdateOwnMetadata: true, // Can update their info
};
```

**Production considerations**:
- Admin tokens for moderators
- Read-only tokens for viewers
- Recording tokens for bots

### 3. Error Handling Strategy

```tsx
// app/api/connection-details/route.ts:13-66
export async function GET(request: NextRequest) {
  try {
    // Main logic here
  } catch (error) {
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
  }
}
```

**Error response examples**:
```
400 Bad Request: "Missing required query parameter: roomName"
500 Internal Server Error: "LIVEKIT_URL is not defined"
500 Internal Server Error: "Invalid region"
```

## Recording API Routes

### Start Recording

**Location**: `app/api/record/start/route.ts`
**Purpose**: Start recording a room session

```tsx
// Simplified structure
export async function POST(request: NextRequest) {
  const { roomName } = await request.json();

  // Create recording request
  const recordingRequest = {
    url: `${LIVEKIT_URL}/rooms/${roomName}`,
    output: {
      fileType: 'mp4',
      // Recording configuration
    }
  };

  // Start recording via LiveKit API
  const response = await livekit.startRecording(recordingRequest);
  return NextResponse.json(response);
}
```

### Stop Recording

**Location**: `app/api/record/stop/route.ts`
**Purpose**: Stop an active recording

```tsx
// Simplified structure
export async function POST(request: NextRequest) {
  const { recordingId } = await request.json();

  const response = await livekit.stopRecording(recordingId);
  return NextResponse.json(response);
}
```

## Environment Configuration

### Development Setup

```bash
# .env.local
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Production Setup

```bash
# Environment variables in production
LIVEKIT_API_KEY=prod_api_key
LIVEKIT_API_SECRET=prod_api_secret
LIVEKIT_URL=wss://your-prod-project.livekit.cloud
```

**Security checklist**:
- ✅ API secrets in environment variables
- ✅ No secrets in frontend code
- ✅ HTTPS in production
- ✅ Token expiration configured
- ✅ Proper CORS settings

## Rate Limiting Considerations

For production, consider adding rate limiting:

```tsx
// Example rate limiting middleware
const rateLimiter = new Map();

export async function GET(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const requests = rateLimiter.get(ip) || [];
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  rateLimiter.set(ip, [...validRequests, now]);

  // Continue with normal logic
}
```

## Next Steps

Now that you understand the complete architecture, let's look at testing strategies and deployment considerations!

---

**Key Takeaways:**
- API routes handle sensitive operations on the server
- JWT tokens provide secure, time-limited access
- Environment variables keep secrets safe
- Proper error handling improves user experience
- Cookie management enables user persistence
- Regional routing optimizes performance

**Next**: [Testing and Deployment →](./18-testing-deployment.md)