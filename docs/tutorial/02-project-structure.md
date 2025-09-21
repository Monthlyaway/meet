# Chapter 2: Project Structure and Setup

Now that you understand our tech stack, let's explore how our LiveKit Meet project is organized. Think of this as learning the layout of a house before you start decorating.

## Project Overview

Our project follows **Next.js App Router** structure, which is like having a well-organized filing system:

```
livekit-meet/
├── app/                    # Main application code (the rooms of our house)
├── lib/                    # Shared utilities (the toolbox)
├── styles/                 # Styling files (the decoration)
├── public/                 # Static files (photos on the wall)
├── docs/                   # Documentation (the manual)
├── package.json            # Project configuration (the blueprint)
├── next.config.js          # Next.js settings (house rules)
└── tsconfig.json          # TypeScript settings (language rules)
```

## The App Directory (Where the Magic Happens)

In Next.js 13+, the `app/` directory is like the main floor of our house:

### Current Structure
```
app/
├── layout.tsx              # Master template for all pages
├── page.tsx                # Home page (/)
├── custom/                 # Custom connection page
│   └── page.tsx
├── rooms/                  # Video conference rooms
│   └── [roomName]/         # Dynamic room pages
│       ├── page.tsx        # Room page component
│       └── PageClientImpl.tsx
└── api/                    # Server-side functionality
    ├── connection-details/
    │   └── route.ts
    └── record/
        ├── start/
        │   └── route.ts
        └── stop/
            └── route.ts
```

Let's examine each part with real code examples:

## 1. Layout.tsx - The Foundation

**Location**: `app/layout.tsx`

This file is like the foundation and frame of every page:

```tsx
// app/layout.tsx:1-6
import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
```

**What this does**:
- Imports global styles (like painting the walls)
- Imports LiveKit's pre-made styles
- Sets up toast notifications for user messages

```tsx
// app/layout.tsx:51-60
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
```

**Think of it like**: The basic HTML structure that wraps around every page, like the walls and ceiling of every room in your house.

## 2. Home Page - The Entry Point

**Location**: `app/page.tsx`

This is what users see first - like your front door:

```tsx
// app/page.tsx:163-200
export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/images/livekit-meet-home.svg" alt="LiveKit Meet" />
          <h2>Open source video conferencing app built on LiveKit Components</h2>
        </div>
        <Suspense fallback="Loading">
          <Tabs>
            <DemoMeetingTab label="Demo" />
            <CustomConnectionTab label="Custom" />
          </Tabs>
        </Suspense>
      </main>
    </>
  );
}
```

**Key concepts here**:
- `<main>` is the primary content area
- `<Suspense>` shows "Loading" while content loads
- `<Tabs>` contains two different ways to start a meeting

## 3. Dynamic Routing - The Room System

**Location**: `app/rooms/[roomName]/page.tsx`

The `[roomName]` folder is special - it creates dynamic pages:

```tsx
// app/rooms/[roomName]/page.tsx:5-16
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
```

**What this means**:
- `/rooms/my-meeting` → `roomName = "my-meeting"`
- `/rooms/work-call` → `roomName = "work-call"`
- Like having a master key that opens any room in a hotel

## 4. API Routes - The Server Brain

**Location**: `app/api/connection-details/route.ts`

This is server-side code that runs before pages load:

```tsx
// app/api/connection-details/route.ts:13-34
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const roomName = request.nextUrl.searchParams.get('roomName');
    const participantName = request.nextUrl.searchParams.get('participantName');

    if (typeof roomName !== 'string') {
      return new NextResponse('Missing required query parameter: roomName', { status: 400 });
    }

    // Generate participant token
    const participantToken = await createParticipantToken(
      { identity: participantName, name: participantName },
      roomName,
    );
```

**What this does**:
- Creates secure tokens for video chat
- Like a bouncer checking IDs before letting people into a club

## The Lib Directory (Shared Tools)

**Location**: `lib/`

This is like a toolbox with utilities used throughout the app:

```
lib/
├── client-utils.ts         # Helper functions
├── types.ts               # TypeScript type definitions
├── Debug.tsx              # Development debugging tools
├── KeyboardShortcuts.tsx  # Keyboard shortcut handling
├── SettingsMenu.tsx       # Settings UI component
└── useSetupE2EE.ts       # End-to-end encryption setup
```

### Example: Client Utilities

```typescript
// lib/client-utils.ts:9-11
export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`;
}
```

This creates room IDs like `"abc4-xy7z"` - simple but unique identifiers.

## Configuration Files

### 1. Package.json - The Shopping List

```json
// package.json:1-5
{
  "name": "livekit-meet",
  "version": "0.2.0",
  "private": true,
  "scripts": {
```

**Scripts section** (like shortcuts for common tasks):
```json
// package.json:6-13
"scripts": {
  "dev": "next dev",          // Start development server
  "build": "next build",      // Build for production
  "start": "next start",      // Start production server
  "lint": "next lint"         // Check code quality
}
```

### 2. Next.js Configuration

```javascript
// next.config.js:2-7
const nextConfig = {
  reactStrictMode: false,              // Disable strict mode for development
  productionBrowserSourceMaps: true,  // Enable debugging in production
  images: {
    formats: ['image/webp'],           // Use modern image format
  },
```

## File Naming Conventions

Next.js uses special file names:

- `page.tsx` → Creates a route (URL endpoint)
- `layout.tsx` → Wraps pages with common elements
- `route.ts` → Creates API endpoints
- `not-found.tsx` → Custom 404 page
- `loading.tsx` → Loading UI
- `error.tsx` → Error handling

## Development Workflow

When you're developing, here's what happens:

1. **Start development server**: `pnpm dev`
2. **Edit files**: Changes appear instantly in browser
3. **Add new pages**: Create new `page.tsx` files
4. **Add new API routes**: Create new `route.ts` files
5. **Import components**: Use from `lib/` directory

## How Files Connect

Let's trace a user journey:

1. **User visits `/`** → `app/page.tsx` loads
2. **User clicks "Start Meeting"** → Navigates to `/rooms/abc4-xy7z`
3. **Room page loads** → `app/rooms/[roomName]/page.tsx` runs
4. **Page needs connection** → Calls `/api/connection-details`
5. **API creates token** → `app/api/connection-details/route.ts` runs
6. **Video starts** → LiveKit components activate

## Why This Structure?

- **Separation of concerns**: UI, logic, and data are separate
- **Reusability**: Components in `lib/` can be used anywhere
- **Maintainability**: Easy to find and fix code
- **Scalability**: Easy to add new features

## Next Steps

Now that you understand the project structure, let's dive into the frontend fundamentals that make it all work!

---

**Key Takeaways:**
- Next.js App Router uses file-based routing
- `app/` directory contains pages and API routes
- `[paramName]` creates dynamic routes
- `lib/` contains reusable utilities
- Configuration files control build and development behavior

**Next**: [Frontend Fundamentals →](./03-frontend-fundamentals.md)