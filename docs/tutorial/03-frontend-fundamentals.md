# Chapter 3: Frontend Fundamentals

Before diving into React and Next.js, let's understand the basic building blocks of web development. Think of this as learning to read before you write a novel.

## The Web Development Trinity

Every website is built with three core technologies:

### 1. HTML (Structure) - The Skeleton

**What it is**: The basic structure and content of web pages
**Think of it like**: The frame and walls of a house

**Real example from our project**:
```tsx
// app/layout.tsx:53-58
return (
  <html lang="en">
    <body data-lk-theme="default">
      <Toaster />
      {children}
    </body>
  </html>
);
```

**Key HTML elements you'll see**:
- `<div>` - Container for other elements
- `<button>` - Clickable buttons
- `<input>` - Text input fields
- `<img>` - Images
- `<main>` - Main content area

### 2. CSS (Styling) - The Paint and Decoration

**What it is**: Controls how HTML looks - colors, sizes, positions
**Think of it like**: The paint, furniture, and decoration in a house

**Real example from our project**:
```css
/* styles/Home.module.css */
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.tabContainer {
  width: 100%;
  max-width: 480px;
}
```

### 3. JavaScript (Behavior) - The Brain

**What it is**: Makes web pages interactive and dynamic
**Think of it like**: The electrical system that makes lights turn on and appliances work

**Real example from our project**:
```tsx
// app/page.tsx:48-54
const startMeeting = () => {
  if (e2ee) {
    router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
  } else {
    router.push(`/rooms/${generateRoomId()}`);
  }
};
```

## Modern Web Development Concepts

### JSX - HTML in JavaScript

In our React project, we write JSX, which looks like HTML but is actually JavaScript:

```tsx
// This JSX...
<div className={styles.tabContent}>
  <p>Try LiveKit Meet for free</p>
  <button onClick={startMeeting}>Start Meeting</button>
</div>

// ...gets converted to JavaScript:
React.createElement('div', { className: styles.tabContent },
  React.createElement('p', null, 'Try LiveKit Meet for free'),
  React.createElement('button', { onClick: startMeeting }, 'Start Meeting')
);
```

**Key differences from HTML**:
- `className` instead of `class`
- `onClick` instead of `onclick`
- JavaScript expressions in `{curly braces}`

### CSS Modules - Scoped Styling

Our project uses CSS Modules to prevent style conflicts:

```tsx
// app/page.tsx:6
import styles from '../styles/Home.module.css';

// Usage:
<main className={styles.main}>
```

**Benefits**:
- Styles are scoped to the component
- No accidental style conflicts
- Better maintainability

### TypeScript - JavaScript with Types

TypeScript adds type safety to prevent errors:

```typescript
// Without TypeScript (JavaScript):
function greetUser(name) {
  return "Hello " + name;
}

// With TypeScript:
function greetUser(name: string): string {
  return "Hello " + name;
}

greetUser(123); // Error: Argument of type 'number' is not assignable to parameter of type 'string'
```

## Event Handling - Making Things Interactive

### Click Events

```tsx
// app/page.tsx:58-60
<button onClick={startMeeting}>
  Start Meeting
</button>
```

### Form Events

```tsx
// app/page.tsx:93-105
const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
  event.preventDefault(); // Prevent page reload
  const formData = new FormData(event.target as HTMLFormElement);
  const serverUrl = formData.get('serverUrl');
  const token = formData.get('token');
  // Process form data...
};
```

### Input Change Events

```tsx
// app/page.tsx:67-68
<input
  type="checkbox"
  checked={e2ee}
  onChange={(ev) => setE2ee(ev.target.checked)}
/>
```

## State Management - Remembering Things

Web applications need to remember information:

```tsx
// app/page.tsx:46-47
const [e2ee, setE2ee] = useState(false);
const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
```

**What this means**:
- `e2ee` is the current value (true/false)
- `setE2ee` is the function to change the value
- When the value changes, the component re-renders

## Asynchronous Operations - Waiting for Things

Web apps often need to wait for data:

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:57-68
const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
  setPreJoinChoices(values);
  const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
  url.searchParams.append('roomName', props.roomName);
  url.searchParams.append('participantName', values.username);

  const connectionDetailsResp = await fetch(url.toString());
  const connectionDetailsData = await connectionDetailsResp.json();
  setConnectionDetails(connectionDetailsData);
}, []);
```

**Key concepts**:
- `async/await` - Wait for operations to complete
- `fetch` - Make HTTP requests to servers
- Promises - Represent future values

## Component Communication

### Props - Passing Data Down

```tsx
// Parent component:
<PageClientImpl
  roomName={_params.roomName}
  region={_searchParams.region}
  hq={hq}
  codec={codec}
/>

// Child component receives props:
export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  // Use props.roomName, props.region, etc.
}
```

### Callbacks - Passing Actions Up

```tsx
// app/page.tsx:8-16
function Tabs(props: React.PropsWithChildren<{}>) {
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  // Pass callback to children
  return <TabButton onClick={() => onTabSelected(0)} />;
}
```

## Error Handling

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:202-205
const handleError = React.useCallback((error: Error) => {
  console.error(error);
  alert(`Encountered an unexpected error: ${error.message}`);
}, []);
```

## Browser APIs We Use

### URL and Navigation

```tsx
// app/page.tsx:9-10
const searchParams = useSearchParams();
const router = useRouter();

// Read URL parameters
const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : 0;

// Navigate to new pages
router.push(`/rooms/${generateRoomId()}`);
```

### Local Storage and Cookies

```tsx
// Used in API routes for remembering users
const randomParticipantPostfix = request.cookies.get(COOKIE_KEY)?.value;
```

## Development Tools

### Browser Developer Tools

Press F12 in any browser to open developer tools:

- **Console**: See JavaScript errors and log messages
- **Elements**: Inspect HTML and CSS
- **Network**: See HTTP requests
- **Sources**: Debug JavaScript code

### Hot Reloading

When you save a file during development:
1. Next.js detects the change
2. Rebuilds only the changed parts
3. Updates the browser automatically
4. Preserves your application state

## Common Patterns in Our Project

### Conditional Rendering

```tsx
// app/page.tsx:71-81
{e2ee && (
  <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
    <label htmlFor="passphrase">Passphrase</label>
    <input
      id="passphrase"
      type="password"
      value={sharedPassphrase}
      onChange={(ev) => setSharedPassphrase(ev.target.value)}
    />
  </div>
)}
```

**Translation**: "Only show this section if encryption is enabled"

### Loading States

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

**Translation**: "Show the pre-join form while waiting for connection details, then show the video conference"

## Next Steps

Now that you understand the fundamentals of web development, you're ready to dive into React concepts and see how they build upon these basics!

---

**Key Takeaways:**
- HTML provides structure, CSS provides styling, JavaScript provides behavior
- JSX combines HTML-like syntax with JavaScript
- TypeScript adds type safety to prevent errors
- State management lets components remember information
- Event handlers make applications interactive
- Asynchronous operations handle server communication

**Next**: [Introduction to React →](./04-react-intro.md)