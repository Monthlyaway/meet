# Chapter 18: Testing and Deployment

Congratulations! You've learned how to build a complete video conferencing application. Now let's cover how to test your application and deploy it to production.

## Testing Strategy

Our project uses several testing approaches to ensure reliability:

### 1. Package.json Scripts

```json
// package.json:11-13
"scripts": {
  "test": "vitest run",
  "lint": "next lint",
  "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\""
}
```

**Testing tools**:
- **Vitest**: Fast unit testing framework
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting

### 2. Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test --watch

# Check code formatting
pnpm format:check

# Fix code formatting
pnpm format:write

# Check code quality
pnpm lint

# Fix auto-fixable lint issues
pnpm lint:fix
```

### 3. Example Unit Test

Let's look at our existing test:

```typescript
// lib/getLiveKitURL.test.ts
import { describe, it, expect } from 'vitest';
import { getLiveKitURL } from './getLiveKitURL';

describe('getLiveKitURL', () => {
  it('should return the same URL when no region is specified', () => {
    const baseURL = 'wss://myproject.livekit.cloud';
    const result = getLiveKitURL(baseURL, undefined);
    expect(result).toBe(baseURL);
  });

  it('should modify URL for specific regions', () => {
    const baseURL = 'wss://myproject.livekit.cloud';
    const result = getLiveKitURL(baseURL, 'us-west');
    expect(result).toBe('wss://myproject-us-west.livekit.cloud');
  });

  it('should handle edge cases gracefully', () => {
    const result = getLiveKitURL('invalid-url', 'us-west');
    expect(result).toBeUndefined();
  });
});
```

**Testing principles**:
- Test different input scenarios
- Verify expected outputs
- Handle edge cases and errors
- Keep tests focused and readable

### 4. Testing React Components

Example test for a React component:

```tsx
// Example: DemoMeetingTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DemoMeetingTab } from './page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('DemoMeetingTab', () => {
  it('should render start meeting button', () => {
    render(<DemoMeetingTab label="Demo" />);
    const button = screen.getByText('Start Meeting');
    expect(button).toBeInTheDocument();
  });

  it('should navigate to room when button is clicked', () => {
    render(<DemoMeetingTab label="Demo" />);
    const button = screen.getByText('Start Meeting');

    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/rooms\/[a-z0-9]{4}-[a-z0-9]{4}$/)
    );
  });

  it('should include encryption hash when E2EE is enabled', () => {
    render(<DemoMeetingTab label="Demo" />);

    const checkbox = screen.getByLabelText('Enable end-to-end encryption');
    fireEvent.click(checkbox);

    const button = screen.getByText('Start Meeting');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/rooms\/[a-z0-9]{4}-[a-z0-9]{4}#.+$/)
    );
  });
});
```

### 5. API Route Testing

```typescript
// Example: connection-details.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../app/api/connection-details/route';

describe('/api/connection-details', () => {
  it('should return 400 for missing roomName', async () => {
    const request = new Request('http://localhost/api/connection-details');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Missing required query parameter: roomName');
  });

  it('should generate valid connection details', async () => {
    const request = new Request(
      'http://localhost/api/connection-details?roomName=test&participantName=John'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('serverUrl');
    expect(data).toHaveProperty('participantToken');
    expect(data.roomName).toBe('test');
    expect(data.participantName).toBe('John');
  });
});
```

## End-to-End Testing

For comprehensive testing, consider using Playwright:

```typescript
// Example: e2e/video-conference.spec.ts
import { test, expect } from '@playwright/test';

test('complete video conference flow', async ({ page }) => {
  // Navigate to home page
  await page.goto('/');

  // Start a demo meeting
  await page.click('text=Start Meeting');

  // Fill pre-join form
  await page.fill('input[name="username"]', 'Test User');
  await page.click('text=Join');

  // Verify video conference loads
  await expect(page.locator('.lk-room-container')).toBeVisible();

  // Test mute functionality
  await page.keyboard.press('Control+KeyM');
  await expect(page.locator('[data-testid="mic-muted"]')).toBeVisible();
});
```

## Development Workflow

### 1. Local Development

```bash
# Start development server
pnpm dev

# In separate terminal, run tests in watch mode
pnpm test --watch

# Check formatting and linting
pnpm format:check && pnpm lint
```

### 2. Pre-commit Checklist

Before committing code:

```bash
# Run all quality checks
pnpm lint
pnpm format:check
pnpm test
pnpm build

# If everything passes, commit
git add .
git commit -m "feat: add new feature"
```

### 3. Environment Setup

Create environment files:

```bash
# .env.local (development)
LIVEKIT_API_KEY=dev_api_key
LIVEKIT_API_SECRET=dev_api_secret
LIVEKIT_URL=wss://your-dev-project.livekit.cloud

# .env.production (production)
LIVEKIT_API_KEY=prod_api_key
LIVEKIT_API_SECRET=prod_api_secret
LIVEKIT_URL=wss://your-prod-project.livekit.cloud
```

## Deployment Options

### 1. Vercel (Recommended for Next.js)

**Steps**:
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

**Vercel configuration**:
```json
// vercel.json
{
  "functions": {
    "app/api/connection-details/route.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "LIVEKIT_API_KEY": "@livekit-api-key",
    "LIVEKIT_API_SECRET": "@livekit-api-secret",
    "LIVEKIT_URL": "@livekit-url"
  }
}
```

### 2. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Build and run**:
```bash
# Build Docker image
docker build -t livekit-meet .

# Run container
docker run -p 3000:3000 \
  -e LIVEKIT_API_KEY=your_key \
  -e LIVEKIT_API_SECRET=your_secret \
  -e LIVEKIT_URL=your_url \
  livekit-meet
```

### 3. Self-hosted with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build for production
pnpm build

# Start with PM2
pm2 start npm --name "livekit-meet" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

**PM2 configuration**:
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'livekit-meet',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      LIVEKIT_API_KEY: 'your_key',
      LIVEKIT_API_SECRET: 'your_secret',
      LIVEKIT_URL: 'your_url'
    }
  }]
};
```

## Production Considerations

### 1. Performance Optimization

```javascript
// next.config.js optimization
const nextConfig = {
  // Enable gzip compression
  compress: true,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['your-cdn-domain.com'],
  },

  // Bundle analyzer (development only)
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};
```

### 2. Security Headers

```javascript
// next.config.js security
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
    ];
  },
};
```

### 3. Monitoring and Analytics

```tsx
// Add error boundary
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Wrap app with error boundary
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

### 4. Load Testing

Test your application under load:

```bash
# Install k6 load testing tool
brew install k6  # macOS
# or
apt install k6  # Ubuntu

# Create load test script
# loadtest.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function() {
  let response = http.get('http://localhost:3000/api/connection-details?roomName=test&participantName=user');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}

# Run load test
k6 run loadtest.js
```

## Debugging Production Issues

### 1. Logging Strategy

```tsx
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    // Send to monitoring service in production
  },

  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
};

// Usage in components
import { logger } from '@/lib/logger';

const handleError = (error: Error) => {
  logger.error('Video conference connection failed', error);
  // Show user-friendly message
};
```

### 2. Health Check Endpoint

```tsx
// app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  return Response.json(health);
}
```

## Congratulations! 🎉

You've completed the comprehensive LiveKit Meet tutorial! You now understand:

- **Frontend fundamentals**: HTML, CSS, JavaScript, TypeScript
- **React concepts**: Components, hooks, state management
- **Next.js framework**: Routing, API routes, deployment
- **LiveKit integration**: Real-time video/audio communication
- **Testing strategies**: Unit tests, integration tests, E2E tests
- **Deployment options**: Vercel, Docker, self-hosted
- **Production considerations**: Performance, security, monitoring

## Next Steps for Your Learning Journey

1. **Build your own features**: Add screen sharing, recording, or chat moderation
2. **Explore advanced React**: Context API, custom hooks, performance optimization
3. **Learn backend development**: Database integration, user authentication
4. **Study system design**: Scalability, caching, microservices
5. **Contribute to open source**: Join the LiveKit community

## Resources for Continued Learning

- **LiveKit Documentation**: https://docs.livekit.io/
- **React Documentation**: https://react.dev/
- **Next.js Documentation**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **MDN Web Docs**: https://developer.mozilla.org/

Keep coding, keep learning, and most importantly - have fun building amazing applications! 🚀

---

**Key Takeaways:**
- Testing ensures application reliability and quality
- Multiple deployment options provide flexibility
- Production optimization improves user experience
- Monitoring helps identify and fix issues quickly
- Continuous learning is essential for growth

**You've completed the tutorial series!** 🎊