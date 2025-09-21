# Chapter 16: Code Analysis - Video Room

Now let's dive deep into the most complex part of our application - the video conferencing room. This is where LiveKit integration, React state management, and real-time communication all come together.

## File Overview

**Main Files**:
- `app/rooms/[roomName]/page.tsx` - Server-side page wrapper
- `app/rooms/[roomName]/PageClientImpl.tsx` - Client-side video conference implementation

**URL Pattern**: `/rooms/my-meeting-room`

## Part 1: Server-Side Page Component

### Dynamic Route Handler

```tsx
// app/rooms/[roomName]/page.tsx:5-33
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;

  const codec =
    typeof _searchParams.codec === 'string' && isVideoCodec(_searchParams.codec)
      ? _searchParams.codec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      roomName={_params.roomName}
      region={_searchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
```

**What this does**:
- **Extracts room name**: From URL like `/rooms/my-meeting` → `roomName = "my-meeting"`
- **Parses query parameters**:
  - `?hq=true` → High quality video
  - `?codec=vp8` → Video codec preference
  - `?region=us-west` → Server region
- **Validates input**: Ensures codec is valid, defaults to 'vp9'
- **Passes to client**: All parameters go to the client-side component

**Next.js pattern**: Server components handle data fetching and validation, then pass clean data to client components.

## Part 2: Client-Side Implementation

### Component Structure

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:37-91
export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(undefined);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(undefined);
```

**State management strategy**:
- `preJoinChoices`: User's camera/mic/name preferences
- `connectionDetails`: Server URL and authentication token

**Two-phase approach**:
1. **Pre-join phase**: User sets up camera/mic and enters name
2. **Conference phase**: Actual video conferencing with LiveKit

### Pre-Join Flow

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:57-68
const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
  setPreJoinChoices(values);
  const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
  url.searchParams.append('roomName', props.roomName);
  url.searchParams.append('participantName', values.username);
  if (props.region) {
    url.searchParams.append('region', props.region);
  }
  const connectionDetailsResp = await fetch(url.toString());
  const connectionDetailsData = await connectionDetailsResp.json();
  setConnectionDetails(connectionDetailsData);
}, []);
```

**Step-by-step breakdown**:
1. **Save user choices**: Camera/mic preferences and username
2. **Build API URL**: Points to our connection details endpoint
3. **Add parameters**: Room name, participant name, region
4. **Fetch token**: Call our API to get LiveKit connection details
5. **Save connection details**: Store for later use in video conference

**Security note**: The API call creates a secure JWT token that proves the user has permission to join this specific room.

### Conditional Rendering Pattern

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:73-87
{connectionDetails === undefined || preJoinChoices === undefined ? (
  <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
    <PreJoin
      defaults={preJoinDefaults}
      onSubmit={handlePreJoinSubmit}
      onError={handlePreJoinError}
    />
  </div>
) : (
  <VideoConferenceComponent
    connectionDetails={connectionDetails}
    userChoices={preJoinChoices}
    options={{ codec: props.codec, hq: props.hq }}
  />
)}
```

**UI state machine**:
- **Loading/Setup**: Show pre-join form
- **Ready**: Show video conference

This ensures users can't join a meeting without proper setup.

## Part 3: Video Conference Component

### Room Configuration

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:106-133
const roomOptions = React.useMemo((): RoomOptions => {
  let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
  if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
    videoCodec = undefined; // E2EE not compatible with all codecs
  }

  const videoCaptureDefaults: VideoCaptureOptions = {
    deviceId: props.userChoices.videoDeviceId ?? undefined,
    resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
  };

  const publishDefaults: TrackPublishDefaults = {
    dtx: false, // Discontinuous transmission
    videoSimulcastLayers: props.options.hq
      ? [VideoPresets.h1080, VideoPresets.h720]
      : [VideoPresets.h540, VideoPresets.h216],
    red: !e2eeEnabled, // Redundant encoding (disabled for E2EE)
    videoCodec,
  };

  return {
    videoCaptureDefaults,
    publishDefaults,
    audioCaptureDefaults: {
      deviceId: props.userChoices.audioDeviceId ?? undefined,
    },
    adaptiveStream: true, // Automatic quality adjustment
    dynacast: true,       // Dynamic broadcasting
    e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
  };
}, [props.userChoices, props.options.hq, props.options.codec]);
```

**Configuration breakdown**:

**Video capture settings**:
- **Device selection**: Use user's preferred camera
- **Resolution**: 4K for high quality, 720p for standard
- **Codec compatibility**: Some codecs don't work with encryption

**Publishing settings**:
- **Simulcast layers**: Send multiple quality versions
  - High quality: 1080p + 720p versions
  - Standard: 540p + 216p versions
- **Redundant encoding**: Extra error correction (disabled for encryption)
- **DTX**: Discontinuous transmission for audio efficiency

**Advanced features**:
- **Adaptive streaming**: Automatically adjusts quality based on network
- **Dynacast**: Only sends video to participants who are watching
- **E2EE**: End-to-end encryption if enabled

### End-to-End Encryption Setup

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:100-102
const keyProvider = new ExternalE2EEKeyProvider();
const { worker, e2eePassphrase } = useSetupE2EE();
const e2eeEnabled = !!(e2eePassphrase && worker);
```

**E2EE implementation**:
- **Key provider**: Manages encryption keys
- **Worker**: Background thread for encryption/decryption
- **Passphrase**: From URL hash (e.g., `#my-secret-key`)

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:137-157
React.useEffect(() => {
  if (e2eeEnabled) {
    keyProvider
      .setKey(decodePassphrase(e2eePassphrase))
      .then(() => {
        room.setE2EEEnabled(true).catch((e) => {
          if (e instanceof DeviceUnsupportedError) {
            alert('Your browser does not support encryption. Please update to the latest version.');
          } else {
            throw e;
          }
        });
      })
      .then(() => setE2eeSetupComplete(true));
  } else {
    setE2eeSetupComplete(true);
  }
}, [e2eeEnabled, room, e2eePassphrase]);
```

**E2EE setup flow**:
1. Check if encryption is enabled
2. Set encryption key from passphrase
3. Enable encryption on the room
4. Handle browser compatibility errors
5. Mark setup as complete

### Room Connection and Event Handling

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:165-196
React.useEffect(() => {
  room.on(RoomEvent.Disconnected, handleOnLeave);
  room.on(RoomEvent.EncryptionError, handleEncryptionError);
  room.on(RoomEvent.MediaDevicesError, handleError);

  if (e2eeSetupComplete) {
    room
      .connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken,
        connectOptions,
      )
      .catch((error) => {
        handleError(error);
      });

    if (props.userChoices.videoEnabled) {
      room.localParticipant.setCameraEnabled(true);
    }
    if (props.userChoices.audioEnabled) {
      room.localParticipant.setMicrophoneEnabled(true);
    }
  }

  return () => {
    room.off(RoomEvent.Disconnected, handleOnLeave);
    room.off(RoomEvent.EncryptionError, handleEncryptionError);
    room.off(RoomEvent.MediaDevicesError, handleError);
  };
}, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices]);
```

**Event-driven architecture**:
- **Setup events**: Listen for disconnection, encryption errors, media errors
- **Connect to room**: Only after encryption setup is complete
- **Enable media**: Turn on camera/mic based on user preferences
- **Cleanup**: Remove event listeners when component unmounts

**Error handling strategy**:
```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:202-211
const handleError = React.useCallback((error: Error) => {
  console.error(error);
  alert(`Encountered an unexpected error: ${error.message}`);
}, []);

const handleEncryptionError = React.useCallback((error: Error) => {
  console.error(error);
  alert(`Encryption error: ${error.message}`);
}, []);
```

### Performance Optimization

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:198
const lowPowerMode = useLowCPUOptimizer(room);

React.useEffect(() => {
  if (lowPowerMode) {
    console.warn('Low power mode enabled');
  }
}, [lowPowerMode]);
```

**CPU optimization**:
- Detects low-power devices (< 6 CPU cores)
- Automatically reduces video quality
- Prevents frame drops and poor user experience

### Final UI Composition

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:219-232
return (
  <div className="lk-room-container">
    <RoomContext.Provider value={room}>
      <KeyboardShortcuts />
      <VideoConference
        chatMessageFormatter={formatChatMessageLinks}
        SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
      />
      <DebugMode />
      <RecordingIndicator />
    </RoomContext.Provider>
  </div>
);
```

**Component hierarchy**:
- **RoomContext.Provider**: Makes room object available to all child components
- **KeyboardShortcuts**: Handles hotkeys (like Ctrl+M to mute)
- **VideoConference**: Main LiveKit component with video grid, controls, chat
- **DebugMode**: Development tools for debugging connections
- **RecordingIndicator**: Shows when meeting is being recorded

## Data Flow Summary

### 1. Initial Load
```
URL: /rooms/my-meeting?hq=true&codec=vp9
  ↓
Server component extracts parameters
  ↓
Client component receives props
  ↓
Pre-join form appears
```

### 2. Pre-Join Submission
```
User fills form (name, camera, mic)
  ↓
handlePreJoinSubmit called
  ↓
API call to /api/connection-details
  ↓
Server generates secure token
  ↓
Connection details stored in state
  ↓
Video conference component renders
```

### 3. Room Connection
```
Room options calculated
  ↓
E2EE setup (if enabled)
  ↓
Event listeners attached
  ↓
room.connect() called
  ↓
Camera/mic enabled
  ↓
LiveKit VideoConference component active
```

### 4. Runtime Events
```
User clicks mute → room.localParticipant.setMicrophoneEnabled(false)
Someone joins → RoomEvent.ParticipantConnected → UI updates
Network issues → Adaptive streaming adjusts quality
User leaves → RoomEvent.Disconnected → Navigate to home
```

## Advanced Patterns Used

### 1. Custom Hooks
- `useSetupE2EE()`: Manages encryption setup
- `useLowCPUOptimizer()`: Performance optimization

### 2. React Context
- `RoomContext.Provider`: Shares room object across components

### 3. Effect Dependencies
- Carefully managed dependency arrays prevent infinite loops
- Effects re-run only when necessary

### 4. Error Boundaries
- Graceful error handling with user-friendly messages
- Different error types handled appropriately

### 5. Memoization
- `useMemo` for expensive room options calculation
- `useCallback` for stable event handlers

## Next Steps

Now let's analyze the API layer that powers the authentication and connection system!

---

**Key Takeaways:**
- Complex components use multiple phases (pre-join → conference)
- State management coordinates multiple async operations
- LiveKit integration requires careful configuration and error handling
- Performance optimizations ensure smooth video experience
- Event-driven architecture handles real-time updates
- Security considerations guide encryption implementation

**Next**: [Code Analysis: API Layer →](./17-api-layer-analysis.md)