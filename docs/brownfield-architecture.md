# LiveKit Meet Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the LiveKit Meet codebase, including technical patterns, integration points, and real-world constraints. It serves as a reference for AI agents working on enhancements to this video conferencing application.

### Document Scope

Comprehensive documentation of the entire LiveKit Meet system for future enhancement planning and development reference.

### Change Log

| Date       | Version | Description                 | Author    |
| ---------- | ------- | --------------------------- | --------- |
| 2025-09-19 | 1.0     | Initial brownfield analysis | Winston   |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `app/page.tsx` (Next.js App Router root page)
- **Layout**: `app/layout.tsx` (Root layout with global styles and metadata)
- **Configuration**: `next.config.js`, `.env.example`
- **Core Components**: `lib/` directory with reusable components and utilities
- **API Routes**: `app/api/connection-details/` and `app/api/record/`
- **Room Management**: `app/rooms/[roomName]/` (Dynamic room routing)
- **Package Config**: `package.json`, `tsconfig.json`

### Key Business Logic Areas

- **Room Creation & Joining**: `app/page.tsx` (home page with room creation UI)
- **Video Conference Logic**: `app/rooms/[roomName]/` directory
- **Settings Management**: `lib/SettingsMenu.tsx`, `lib/CameraSettings.tsx`, `lib/MicrophoneSettings.tsx`
- **LiveKit Integration**: Spread across components using `@livekit/components-react`
- **Recording Functionality**: `lib/RecordingIndicator.tsx`

## High Level Architecture

### Technical Summary

LiveKit Meet is a Next.js-based video conferencing application that leverages the LiveKit ecosystem for real-time communication. Built with React Server Components using Next.js App Router, it provides a modern, type-safe development experience with TypeScript.

### Actual Tech Stack

| Category          | Technology                    | Version  | Notes                                    |
| ----------------- | ----------------------------- | -------- | ---------------------------------------- |
| Runtime           | Node.js                       | >=18     | Required minimum version                 |
| Framework         | Next.js                       | 15.2.4   | App Router with React Server Components |
| Frontend Library  | React                         | 18.3.1   | With React DOM 18.3.7                   |
| Language          | TypeScript                    | 5.9.2    | Strict mode enabled                      |
| Package Manager   | PNPM                          | 10.9.0   | Specified in packageManager field       |
| LiveKit Client    | livekit-client               | 2.15.7   | Core WebRTC functionality               |
| LiveKit Server    | livekit-server-sdk           | 2.13.3   | Server-side SDK for token generation    |
| UI Components     | @livekit/components-react    | 2.9.14   | Pre-built LiveKit React components     |
| Component Styles  | @livekit/components-styles   | 1.1.6    | Default styling for LiveKit components  |
| Audio Processing  | @livekit/krisp-noise-filter  | 0.3.4    | Noise reduction capabilities           |
| Track Processing  | @livekit/track-processors    | 0.6.0    | Audio/video track processing           |
| Toast Notifications | react-hot-toast            | 2.5.2    | User feedback notifications            |
| Keyboard Handling | tinykeys                     | 3.0.0    | Keyboard shortcuts management          |
| Logging           | @datadog/browser-logs        | 5.23.3   | Optional browser logging               |

### Repository Structure Reality Check

- **Type**: Single repository (monorepo structure)
- **Package Manager**: PNPM with lockfile
- **Build System**: Next.js with custom webpack configuration
- **Notable**: Custom CORS headers for WebRTC, source map support enabled

## Source Tree and Module Organization

### Project Structure (Actual)

```text
livekit-meet/
├── app/                     # Next.js App Router directory
│   ├── api/                 # API routes
│   │   ├── connection-details/  # LiveKit connection token generation
│   │   └── record/          # Recording functionality endpoints
│   ├── custom/              # Custom room functionality
│   ├── rooms/               # Dynamic room pages
│   │   └── [roomName]/      # Individual room implementation
│   ├── layout.tsx           # Root layout with global config
│   └── page.tsx             # Home page with room creation
├── lib/                     # Reusable components and utilities
│   ├── CameraSettings.tsx   # Camera configuration component
│   ├── MicrophoneSettings.tsx # Audio configuration component
│   ├── SettingsMenu.tsx     # Main settings interface
│   ├── Debug.tsx            # Development debugging tools
│   ├── RecordingIndicator.tsx # Recording status display
│   ├── KeyboardShortcuts.tsx # Keyboard shortcuts component
│   ├── client-utils.ts      # Client-side utility functions
│   ├── getLiveKitURL.ts     # LiveKit URL resolution
│   ├── types.ts             # TypeScript type definitions
│   ├── usePerfomanceOptimiser.ts # Performance optimization hook
│   └── useSetupE2EE.ts      # End-to-end encryption setup
├── public/                  # Static assets
├── styles/                  # Global CSS styles
├── .github/                 # GitHub workflows and assets
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── .env.example             # Environment variable template
```

### Key Modules and Their Purpose

- **Room Management**: `app/rooms/[roomName]/` - Dynamic routing for individual video conference rooms
- **API Layer**: `app/api/` - Server-side endpoints for LiveKit integration and recording
- **Settings Components**: `lib/SettingsMenu.tsx`, `lib/CameraSettings.tsx`, `lib/MicrophoneSettings.tsx` - User preference management
- **Client Utilities**: `lib/client-utils.ts` - Helper functions for room ID generation and encoding
- **Performance**: `lib/usePerfomanceOptimiser.ts` - Client-side performance optimization
- **Security**: `lib/useSetupE2EE.ts` - End-to-end encryption configuration

## Data Models and APIs

### Data Models

LiveKit Meet uses LiveKit's built-in data structures rather than custom database models:

- **Room Models**: Handled by LiveKit server (room names, participant management)
- **Participant Models**: LiveKit client-side participant objects
- **Track Models**: Audio/video track representations from LiveKit
- **Connection Models**: Token-based authentication through LiveKit

### API Specifications

- **Connection Details**: `app/api/connection-details/` - Generates LiveKit connection tokens
- **Recording API**: `app/api/record/` - Manages recording start/stop functionality
- **External LiveKit API**: Integration with LiveKit Cloud services for room management

### Environment Configuration

Required environment variables (see `.env.example`):
- `LIVEKIT_API_KEY` - LiveKit Cloud API key
- `LIVEKIT_API_SECRET` - LiveKit Cloud API secret
- `LIVEKIT_URL` - LiveKit server WebSocket URL
- Optional S3 configuration for recording storage
- Optional Datadog logging configuration

## Technical Patterns and Conventions

### Code Organization Patterns

- **Component Structure**: Functional React components with TypeScript
- **Hooks Pattern**: Custom hooks for complex logic (`usePerfomanceOptimiser`, `useSetupE2EE`)
- **File Naming**: PascalCase for components, camelCase for utilities
- **Import Strategy**: Absolute imports using `@/` alias for project root

### State Management

- **LiveKit State**: Managed by `@livekit/components-react` hooks and providers
- **Local State**: React useState for component-level state
- **No Global State**: No Redux, Zustand, or similar state management libraries

### Styling Approach

- **CSS Modules**: Used for component-specific styling (`styles/Home.module.css`)
- **LiveKit Styles**: Pre-built styles from `@livekit/components-styles`
- **Global Styles**: Imported in `app/layout.tsx`

## Integration Points and External Dependencies

### LiveKit Ecosystem Integration

| Service           | Purpose                    | Integration Type | Key Files                           |
| ----------------- | -------------------------- | ---------------- | ----------------------------------- |
| LiveKit Cloud     | WebRTC infrastructure     | SDK + REST API   | `app/api/connection-details/`       |
| LiveKit Client    | Browser WebRTC client     | JavaScript SDK   | Throughout React components         |
| LiveKit Server    | Token generation          | Server SDK       | `app/api/` routes                   |

### External Services (Optional)

- **S3 Storage**: Recording storage (configurable)
- **Datadog**: Browser logging and monitoring (optional)

### Security Configuration

- **CORS Headers**: Configured in `next.config.js` for WebRTC compatibility
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: credentialless`
- **Token-based Auth**: LiveKit tokens for room access
- **Environment Isolation**: Separate configurations per environment

## Development and Deployment

### Local Development Setup

1. **Install Dependencies**: `pnpm install`
2. **Environment Setup**: Copy `.env.example` to `.env.local` and configure LiveKit credentials
3. **Development Server**: `pnpm dev` (runs on localhost:3000)
4. **Required Services**: LiveKit Cloud account or self-hosted LiveKit server

### Build and Deployment Process

- **Build Command**: `pnpm build` (Next.js production build)
- **Start Command**: `pnpm start` (production server)
- **Linting**: `pnpm lint` with `pnpm lint:fix`
- **Testing**: `pnpm test` (Vitest test runner)
- **Formatting**: Prettier with `pnpm format:check` and `pnpm format:write`

### Next.js Configuration Specifics

- **React Strict Mode**: Disabled (`reactStrictMode: false`)
- **Source Maps**: Enabled for production debugging
- **Webpack Config**: Custom source-map-loader for .mjs files
- **Image Optimization**: WebP format preference

## Testing Reality

### Current Test Coverage

- **Test Framework**: Vitest (modern alternative to Jest)
- **Test Files**: `lib/getLiveKitURL.test.ts` (URL resolution testing)
- **Coverage**: Minimal unit testing, primarily focused on utility functions
- **Integration Tests**: None currently implemented
- **E2E Tests**: None currently implemented

### Running Tests

```bash
pnpm test           # Runs Vitest test suite
pnpm lint           # ESLint code quality checks
pnpm format:check   # Prettier formatting validation
```

## Technical Debt and Known Issues

### Current Technical Debt

1. **Limited Test Coverage**: Only basic utility function testing exists
2. **React Strict Mode Disabled**: Indicates potential issues with component lifecycle
3. **TypeScript Ignore Comments**: Found in `app/page.tsx` line 29 (`// @ts-ignore`)
4. **No Error Boundaries**: No global error handling for React component failures
5. **Minimal Documentation**: Limited inline code documentation

### Workarounds and Gotchas

- **CORS Configuration**: Custom headers required for WebRTC functionality
- **Environment Variables**: Must configure LiveKit credentials for any functionality
- **Source Maps**: Enabled in production which may expose code structure
- **Package Manager**: Project specifically requires PNPM, not npm or yarn

## Performance Considerations

### Optimization Strategies

- **Performance Hook**: `lib/usePerfomanceOptimiser.ts` for client-side optimization
- **Lazy Loading**: Likely used in room components (needs verification)
- **Source Maps**: Enabled for debugging but impacts bundle size
- **Image Optimization**: Next.js automatic WebP conversion

### Known Performance Constraints

- **WebRTC Overhead**: Inherent video/audio processing load
- **LiveKit Components**: Pre-built components may have performance limitations
- **Browser Requirements**: Modern browser required for WebRTC support

## Security Implementation

### Current Security Measures

- **Token-based Authentication**: LiveKit JWT tokens for room access
- **CORS Headers**: Proper cross-origin configuration for WebRTC
- **Environment Isolation**: Secrets managed through environment variables
- **HTTPS Required**: LiveKit requires secure connections for WebRTC

### Security Considerations

- **Token Expiration**: LiveKit tokens should have appropriate expiration times
- **Room Access Control**: Currently based on knowing room name/URL
- **Recording Privacy**: S3 storage security depends on bucket configuration
- **Client-side Logs**: Datadog integration may log sensitive information

## Appendix - Useful Commands and Scripts

### Development Commands

```bash
pnpm dev           # Start development server (localhost:3000)
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm lint:fix      # Fix ESLint issues automatically
pnpm test          # Run Vitest test suite
pnpm format:check  # Check Prettier formatting
pnpm format:write  # Apply Prettier formatting
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables:
# LIVEKIT_API_KEY=your_api_key
# LIVEKIT_API_SECRET=your_api_secret
# LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Common Development Tasks

- **Add New Component**: Create in `lib/` directory following existing patterns
- **Add API Route**: Create in `app/api/` directory with route.ts file
- **Add New Page**: Create in `app/` directory following App Router conventions
- **Modify Styles**: Edit global styles in `styles/` or use CSS modules

---

*This document reflects the actual state of the LiveKit Meet codebase as of analysis date. For future enhancements, this serves as the baseline architecture understanding for AI agents and developers.*