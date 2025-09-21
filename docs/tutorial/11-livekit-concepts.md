# Chapter 11: LiveKit Concepts

Now that you understand React and Next.js, let's dive into LiveKit - the heart of our video conferencing application. LiveKit handles all the complex real-time communication so we can focus on building great user experiences.

## What is LiveKit?

**LiveKit** is an open-source platform for building real-time video, audio, and data applications. Think of it as:
- **The phone system** for your app
- **The video camera crew** that handles all the technical details
- **The traffic controller** managing data flow between users

## Key LiveKit Concepts

### 1. Rooms - Virtual Meeting Spaces

A **Room** is like a virtual meeting room where participants can join to communicate:

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:135
const room = React.useMemo(() => new Room(roomOptions), []);
```

**Real-world analogy**: Like a Zoom meeting room with a unique ID

**In our project**:
- URL `/rooms/abc4-xy7z` creates room named "abc4-xy7z"
- Each room is isolated from others
- Participants can only see/hear others in the same room

### 2. Participants - People in the Room

**Participants** are the users connected to a room:

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:181-189
if (props.userChoices.videoEnabled) {
  room.localParticipant.setCameraEnabled(true);
}
if (props.userChoices.audioEnabled) {
  room.localParticipant.setMicrophoneEnabled(true);
}
```

**Types of participants**:
- **Local Participant**: You (the current user)
- **Remote Participants**: Other people in the room

### 3. Tracks - Audio/Video Streams

**Tracks** are the actual audio and video streams:

```tsx
// lib/types.ts:7-8
audioTrack?: LocalAudioTrack;
videoTrack?: LocalVideoTrack;
```

**Track types**:
- **Audio Track**: Microphone input
- **Video Track**: Camera input
- **Screen Share Track**: Screen capture
- **Data Track**: Text messages, file transfers

### 4. Connection Details - Getting Permission to Join

Before joining a room, you need credentials:

```tsx
// app/api/connection-details/route.ts:49-55
const data: ConnectionDetails = {
  serverUrl: livekitServerUrl,     // Where to connect
  roomName: roomName,              // Which room to join
  participantToken: participantToken, // Your permission token
  participantName: participantName,   // Your display name
};
```

**Security flow**:
1. Client requests to join room "abc4-xy7z" as "John"
2. Server creates secure token for "John" in room "abc4-xy7z"
3. Client uses token to connect to LiveKit server
4. LiveKit server validates token and allows connection

## LiveKit SDK Components

Our project uses several LiveKit packages:

### 1. livekit-client - Core Functionality

```json
// package.json:21
"livekit-client": "2.15.7"
```

**What it provides**:
- Room connection and management
- Audio/video track handling
- Real-time communication protocols

**Key imports**:
```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:17-28
import {
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
```

### 2. @livekit/components-react - Pre-built UI

```json
// package.json:17
"@livekit/components-react": "2.9.14"
```

**What it provides**:
- Ready-to-use React components
- Pre-join UI, video grids, chat, controls

**Key components**:
```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:10-16
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
} from '@livekit/components-react';
```

### 3. @livekit/components-styles - UI Styling

```json
// package.json:18
"@livekit/components-styles": "1.1.6"
```

**What it provides**:
- CSS styles for LiveKit components
- Themes and visual customization

**Usage**:
```tsx
// app/layout.tsx:2-3
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
```

### 4. livekit-server-sdk - Server-side Tools

```json
// package.json:22
"livekit-server-sdk": "2.13.3"
```

**What it provides**:
- Token generation
- Room management
- Recording control

**Usage**:
```tsx
// app/api/connection-details/route.ts:4
import { AccessToken, AccessTokenOptions, VideoGrant } from 'livekit-server-sdk';
```

## Room Configuration

### Room Options

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:106-133
const roomOptions = React.useMemo((): RoomOptions => {
  return {
    videoCaptureDefaults: {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    },
    publishDefaults: {
      dtx: false, // Discontinuous transmission
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled, // Redundant encoding
      videoCodec,
    },
    audioCaptureDefaults: {
      deviceId: props.userChoices.audioDeviceId ?? undefined,
    },
    adaptiveStream: true, // Automatic quality adjustment
    dynacast: true,       // Dynamic broadcasting
    e2ee: e2eeEnabled ? { keyProvider, worker } : undefined,
  };
}, [props.userChoices, props.options.hq, props.options.codec]);
```

**Key settings explained**:
- **videoCaptureDefaults**: Camera settings (resolution, device)
- **publishDefaults**: How to send video to others
- **adaptiveStream**: Automatically adjust quality based on network
- **dynacast**: Only send video to participants who need it
- **e2ee**: End-to-end encryption configuration

### Video Quality Presets

```tsx
// High quality meeting
resolution: VideoPresets.h2160  // 4K video
videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720]

// Standard quality meeting
resolution: VideoPresets.h720   // HD video
videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216]
```

**Simulcast**: Sends multiple quality versions so users with slow connections get lower quality automatically.

## Connection Flow

Let's trace what happens when someone joins a meeting:

### 1. Pre-Join Phase

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:75-80
<PreJoin
  defaults={preJoinDefaults}
  onSubmit={handlePreJoinSubmit}
  onError={handlePreJoinError}
/>
```

**User experience**:
- Test camera and microphone
- Enter display name
- Choose audio/video settings

### 2. Token Generation

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:57-68
const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
  const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
  url.searchParams.append('roomName', props.roomName);
  url.searchParams.append('participantName', values.username);

  const connectionDetailsResp = await fetch(url.toString());
  const connectionDetailsData = await connectionDetailsResp.json();
  setConnectionDetails(connectionDetailsData);
}, []);
```

**Server-side token creation**:
```tsx
// app/api/connection-details/route.ts:69-81
function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, userInfo);
  at.ttl = '5m'; // Token expires in 5 minutes
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,    // Can send audio/video
    canPublishData: true, // Can send chat messages
    canSubscribe: true,   // Can receive audio/video
  };
  at.addGrant(grant);
  return at.toJwt();
}
```

### 3. Room Connection

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:171-189
room.connect(
  props.connectionDetails.serverUrl,
  props.connectionDetails.participantToken,
  connectOptions,
);

if (props.userChoices.videoEnabled) {
  room.localParticipant.setCameraEnabled(true);
}
if (props.userChoices.audioEnabled) {
  room.localParticipant.setMicrophoneEnabled(true);
}
```

### 4. Event Handling

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:166-168
room.on(RoomEvent.Disconnected, handleOnLeave);
room.on(RoomEvent.EncryptionError, handleEncryptionError);
room.on(RoomEvent.MediaDevicesError, handleError);
```

**Common events**:
- `Disconnected`: User left or lost connection
- `ParticipantConnected`: Someone joined the room
- `TrackSubscribed`: Started receiving someone's audio/video
- `EncryptionError`: Problem with end-to-end encryption

## End-to-End Encryption (E2EE)

Our app supports optional encryption:

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:100-102
const keyProvider = new ExternalE2EEKeyProvider();
const { worker, e2eePassphrase } = useSetupE2EE();
const e2eeEnabled = !!(e2eePassphrase && worker);
```

**How E2EE works**:
1. User enables encryption and enters passphrase
2. Passphrase generates encryption keys
3. All audio/video is encrypted before sending
4. Only participants with the passphrase can decrypt

**Security**: Even LiveKit servers can't see the content - only encrypted data passes through.

## LiveKit vs Other Solutions

### Why LiveKit?

**Compared to building from scratch**:
- ✅ Handles complex WebRTC protocols
- ✅ Manages network traversal (NAT, firewalls)
- ✅ Provides scalable infrastructure
- ✅ Open source and self-hostable

**Compared to other services**:
- ✅ Open source (no vendor lock-in)
- ✅ Can self-host for privacy
- ✅ Generous free tier
- ✅ Excellent developer experience

## Performance Optimizations

### 1. Adaptive Streaming

```tsx
// Automatically adjusts quality based on network conditions
adaptiveStream: true
```

### 2. Dynacast

```tsx
// Only sends video to participants who are viewing it
dynacast: true
```

### 3. Simulcast

```tsx
// Sends multiple quality versions
videoSimulcastLayers: [VideoPresets.h1080, VideoPresets.h720]
```

### 4. CPU Optimization

```tsx
// lib/usePerfomanceOptimiser.ts - Custom hook to detect low-power devices
const lowPowerMode = useLowCPUOptimizer(room);
```

## Next Steps

Now you understand LiveKit's core concepts. Let's see how to set up LiveKit in a project and configure it for production use!

---

**Key Takeaways:**
- LiveKit handles complex real-time communication
- Rooms contain participants who share tracks (audio/video)
- Security tokens control access and permissions
- Pre-built components speed up development
- E2EE provides privacy even from servers
- Performance optimizations ensure smooth experience

**Next**: [Setting Up LiveKit →](./12-livekit-setup.md)