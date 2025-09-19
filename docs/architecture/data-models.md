# Data Models

### User

**Purpose:** Represents authenticated users who can create and join gaming chat rooms

**Key Attributes:**
- id: uint (primary key) - Unique user identifier
- username: string - Display name for gaming
- email: string - User email for authentication
- password_hash: string - Securely hashed password
- created_at: timestamp - Account creation time
- updated_at: timestamp - Last profile update

#### TypeScript Interface
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

interface UserLogin {
  email: string;
  password: string;
}
```

#### Relationships
- One user can create many gaming rooms (one-to-many with Room)
- One user can join many gaming rooms (many-to-many through RoomMember)
- One user can be in one channel at a time (one-to-one with current channel)

### Room

**Purpose:** Represents gaming chat rooms with unique access tokens and hierarchical channel structure

**Key Attributes:**
- id: uint (primary key) - Unique room identifier
- name: string - Room display name
- access_token: string - UUID token for joining room
- creator_id: uint - Foreign key to User who created room
- created_at: timestamp - Room creation time
- is_active: boolean - Whether room is currently active

#### TypeScript Interface
```typescript
interface Room {
  id: number;
  name: string;
  accessToken: string;
  creatorId: number;
  createdAt: string;
  isActive: boolean;
  creator?: User;
  channels?: Channel[];
  members?: User[];
}

interface RoomCreation {
  name: string;
}

interface RoomJoin {
  accessToken: string;
}
```

#### Relationships
- One room belongs to one creator (many-to-one with User)
- One room has many channels including main lobby (one-to-many with Channel)
- One room has many members (many-to-many through RoomMember)

### Channel

**Purpose:** Represents voice channels within gaming rooms (main lobby + admin-created team channels)

**Key Attributes:**
- id: uint (primary key) - Unique channel identifier
- name: string - Channel display name
- room_id: uint - Foreign key to parent Room
- is_main_lobby: boolean - Whether this is the default main lobby
- livekit_room_name: string - Corresponding LiveKit room identifier
- created_at: timestamp - Channel creation time

#### TypeScript Interface
```typescript
interface Channel {
  id: number;
  name: string;
  roomId: number;
  isMainLobby: boolean;
  livekitRoomName: string;
  createdAt: string;
  room?: Room;
  currentUsers?: User[];
}

interface ChannelCreation {
  name: string;
  roomId: number;
}
```

#### Relationships
- One channel belongs to one room (many-to-one with Room)
- One channel can have many users currently connected (one-to-many with UserChannel)
- One channel maps to one LiveKit room for voice separation

### RoomMember

**Purpose:** Junction table tracking which users are members of which gaming rooms

**Key Attributes:**
- id: uint (primary key) - Unique membership identifier
- user_id: uint - Foreign key to User
- room_id: uint - Foreign key to Room
- joined_at: timestamp - When user joined the room
- is_active: boolean - Whether membership is currently active

#### TypeScript Interface
```typescript
interface RoomMember {
  id: number;
  userId: number;
  roomId: number;
  joinedAt: string;
  isActive: boolean;
}
```

#### Relationships
- Links User and Room in many-to-many relationship
- Tracks room membership history and status

### UserChannel

**Purpose:** Tracks which channel each user is currently in for voice separation

**Key Attributes:**
- id: uint (primary key) - Unique connection identifier
- user_id: uint - Foreign key to User
- channel_id: uint - Foreign key to Channel
- connected_at: timestamp - When user joined this channel
- livekit_participant_id: string - LiveKit participant identifier

#### TypeScript Interface
```typescript
interface UserChannel {
  id: number;
  userId: number;
  channelId: number;
  connectedAt: string;
  livekitParticipantId: string;
  user?: User;
  channel?: Channel;
}
```

#### Relationships
- One user can be in one channel at a time (one-to-one active relationship)
- One channel can have many users currently connected (one-to-many)
- Maps to LiveKit participant for voice communication
