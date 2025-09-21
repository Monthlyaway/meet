# Chapter 1: Understanding the Tech Stack

Welcome to your journey into frontend development! Before we start coding, let's understand the tools and technologies we'll be using to build our video conferencing application.

## What is a Tech Stack?

A **tech stack** is like a recipe for building software. Just as a cake needs flour, eggs, and sugar, our video conferencing app needs different technologies working together.

## Our Tech Stack Components

### 1. Package Manager: pnpm

**What it is**: A tool that downloads and manages code libraries (like ingredients for our app)

**Real example from our project**:
```json
// package.json - Our "shopping list" of ingredients
{
  "name": "livekit-meet",
  "version": "0.2.0",
  "dependencies": {
    "react": "18.3.1",
    "next": "15.2.4",
    "livekit-client": "2.15.7"
  }
}
```

**Think of it like**: A grocery delivery service that brings you exactly the ingredients you need for cooking.

### 2. Programming Language: TypeScript

**What it is**: JavaScript with extra safety features to catch mistakes early

**Real example from our project**:
```typescript
// lib/types.ts:23-28
export type ConnectionDetails = {
  serverUrl: string;        // Must be text
  roomName: string;         // Must be text
  participantName: string;  // Must be text
  participantToken: string; // Must be text
};
```

**Think of it like**: A recipe that tells you exactly what type of ingredient to use (flour vs sugar) instead of just saying "white powder."

### 3. User Interface: React

**What it is**: A library for building interactive user interfaces (what users see and click)

**Real example from our project**:
```tsx
// app/page.tsx:44-54 - A reusable piece of UI
function DemoMeetingTab(props: { label: string }) {
  const [e2ee, setE2ee] = useState(false);  // Remember if encryption is on/off

  return (
    <div className={styles.tabContent}>
      <p>Try LiveKit Meet for free with our live demo project.</p>
      <button onClick={startMeeting}>Start Meeting</button>
    </div>
  );
}
```

**Think of it like**: LEGO blocks - you create small reusable pieces and combine them to build something bigger.

### 4. Framework: Next.js

**What it is**: A framework built on top of React that adds powerful features like routing and server-side logic

**Real example from our project**:
```
app/
├── page.tsx              // Home page (like index.html)
├── layout.tsx            // Template for all pages
├── rooms/[roomName]/     // Dynamic pages for each room
│   └── page.tsx          // Video conference page
└── api/                  // Server-side code
    └── connection-details/
        └── route.ts      // API endpoint
```

**Think of it like**: A house blueprint system - it provides the structure while you decorate the rooms (React components).

### 5. Video/Audio: LiveKit SDK

**What it is**: A set of tools for adding real-time video and audio to web applications

**Real example from our project**:
```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:21-28
import {
  RoomOptions,
  VideoCodec,
  Room,
  RoomConnectOptions,
} from 'livekit-client';

// Create a room for video conferencing
const room = React.useMemo(() => new Room(roomOptions), []);
```

**Think of it like**: A pre-built video camera and microphone system that you can add to your app.

## How They Work Together

Let's trace what happens when someone visits our app:

1. **User visits website** → Next.js serves the page
2. **Page loads** → React components create the user interface
3. **User clicks "Start Meeting"** → TypeScript ensures we handle the click correctly
4. **Meeting starts** → LiveKit connects users with video/audio
5. **Need new features?** → pnpm downloads additional libraries

## Key Dependencies Analysis

Let's look at our `package.json` and understand each dependency:

### Core Framework Dependencies
```json
{
  "next": "15.2.4",           // The Next.js framework
  "react": "18.3.1",          // Core React library
  "react-dom": "18.3.1"       // Connects React to web pages
}
```

### LiveKit Dependencies
```json
{
  "@livekit/components-react": "2.9.14",    // Pre-built video UI components
  "@livekit/components-styles": "1.1.6",    // Styling for video components
  "livekit-client": "2.15.7",               // Core video/audio functionality
  "livekit-server-sdk": "2.13.3"            // Server-side video management
}
```

### Additional Tools
```json
{
  "react-hot-toast": "^2.5.2",   // Pretty notification messages
  "tinykeys": "^3.0.0"           // Keyboard shortcuts (like Ctrl+M to mute)
}
```

## Development vs Production

Our project has two types of dependencies:

**Dependencies** (needed when app runs):
- Like ingredients in the final cake

**DevDependencies** (only needed during development):
- Like mixing bowls and measuring cups - needed to make the cake, but not in the final product

```json
{
  "devDependencies": {
    "typescript": "5.9.2",        // TypeScript compiler
    "@types/react": "18.3.23",    // Type definitions for React
    "prettier": "3.6.2"           // Code formatter
  }
}
```

## Why These Choices?

- **TypeScript**: Catches errors before users see them
- **React**: Makes complex UIs manageable
- **Next.js**: Handles the complicated web server stuff
- **LiveKit**: Saves months of video development work
- **pnpm**: Faster and more efficient than npm

## Next Steps

Now that you understand our tech stack, let's explore how these technologies are organized in our project structure!

---

**Key Takeaways:**
- A tech stack is a collection of technologies working together
- Each tool has a specific purpose in our development process
- TypeScript adds safety to JavaScript
- React creates reusable UI components
- Next.js provides the framework structure
- LiveKit handles the complex video/audio functionality

**Next**: [Project Structure and Setup →](./02-project-structure.md)