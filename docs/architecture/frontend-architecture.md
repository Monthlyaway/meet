# Frontend Architecture

### Component Organization
```text
app/
├── (auth)/                      # Authentication route group
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── register/
│       └── page.tsx            # Registration page
├── (dashboard)/                 # Protected dashboard routes
│   ├── create-room/
│   │   └── page.tsx            # Room creation page
│   └── join-room/
│       └── page.tsx            # Room joining page
├── rooms/
│   └── [roomId]/
│       └── page.tsx            # Gaming room interface (extended)
├── api/                         # Existing Next.js API routes (preserved)
├── layout.tsx                   # Root layout (extended with auth)
└── page.tsx                     # Home page (modified for gaming)

lib/
├── auth/                        # Authentication utilities
│   ├── AuthContext.tsx         # React context for auth state
│   ├── useAuth.ts              # Authentication hook
│   └── authService.ts          # API calls for auth
├── gaming/                      # Gaming-specific components
│   ├── RoomCreator.tsx         # Room creation component
│   ├── RoomJoiner.tsx          # Room joining component
│   ├── ChannelSidebar.tsx      # Channel navigation
│   └── useRoom.ts              # Room state management hook
├── api/                         # Backend API integration
│   ├── apiClient.ts            # HTTP client configuration
│   └── endpoints.ts            # API endpoint definitions
└── (existing LiveKit components preserved)
```

### State Management Architecture
- **React Context + useReducer**: Authentication state management
- **Custom Hooks**: Room and channel state with local state and API integration
- **LiveKit State**: Managed by existing LiveKit components (preserved)
- **Local Storage**: JWT token persistence across browser sessions

### API Client Setup
```typescript
class ApiClient {
  private baseURL = 'http://localhost:8080';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth-token');

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
}
```
