# Chapter 4: Introduction to React

Now that you understand web fundamentals, let's explore React - the library that powers our user interface. React revolutionized web development by making complex UIs manageable through components.

## What is React?

**React** is a JavaScript library for building user interfaces. Think of it like a smart construction system for websites:

- **Traditional approach**: Build each page from scratch
- **React approach**: Create reusable components, then combine them like LEGO blocks

## Core React Concepts

### 1. Components - Reusable UI Pieces

A component is a self-contained piece of UI that you can reuse anywhere:

```tsx
// app/page.tsx:44-84 - Our DemoMeetingTab component
function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(`/rooms/${generateRoomId()}`);
    }
  };

  return (
    <div className={styles.tabContent}>
      <p>Try LiveKit Meet for free with our live demo project.</p>
      <button onClick={startMeeting}>Start Meeting</button>
      {/* Encryption settings... */}
    </div>
  );
}
```

**What makes this a component**:
- **Input (props)**: Receives a `label`
- **Logic**: Handles meeting creation and encryption
- **Output (JSX)**: Returns UI elements
- **Reusable**: Can be used anywhere in the app

### 2. Props - Passing Data Down

Props are like function parameters for components:

```tsx
// Usage: Pass data to component
<DemoMeetingTab label="Demo" />

// Component: Receive data
function DemoMeetingTab(props: { label: string }) {
  // Use props.label anywhere in the component
}
```

**Real example from our tabs system**:
```tsx
// app/page.tsx:182-185
<Tabs>
  <DemoMeetingTab label="Demo" />
  <CustomConnectionTab label="Custom" />
</Tabs>
```

### 3. State - Remembering Information

Components can remember and update information using state:

```tsx
// app/page.tsx:46-47
const [e2ee, setE2ee] = useState(false);
const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
```

**Breaking this down**:
- `useState(false)` - Start with encryption disabled
- `e2ee` - Current value (true or false)
- `setE2ee` - Function to change the value
- When state changes, React re-renders the component

**State in action**:
```tsx
// app/page.tsx:66-68
<input
  type="checkbox"
  checked={e2ee}
  onChange={(ev) => setE2ee(ev.target.checked)}
/>
```

When user checks the box → `setE2ee(true)` → Component re-renders → Checkbox appears checked

## React vs Regular JavaScript

### Traditional JavaScript (DOM Manipulation)
```javascript
// Traditional way - manually update HTML
const button = document.getElementById('myButton');
button.addEventListener('click', function() {
  const counter = document.getElementById('counter');
  counter.textContent = parseInt(counter.textContent) + 1;
});
```

### React Way (Declarative)
```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span id="counter">{count}</span>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Key difference**: React automatically updates the UI when state changes. You describe what the UI should look like, not how to change it.

## Component Lifecycle with Hooks

### useEffect - Side Effects

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:165-196
React.useEffect(() => {
  room.on(RoomEvent.Disconnected, handleOnLeave);
  room.on(RoomEvent.EncryptionError, handleEncryptionError);

  if (e2eeSetupComplete) {
    room.connect(
      props.connectionDetails.serverUrl,
      props.connectionDetails.participantToken,
      connectOptions,
    );
  }

  return () => {
    room.off(RoomEvent.Disconnected, handleOnLeave);
    room.off(RoomEvent.EncryptionError, handleEncryptionError);
  };
}, [e2eeSetupComplete, room, props.connectionDetails]);
```

**What this does**:
- **Setup**: Add event listeners when component mounts
- **Dependencies**: Re-run when `e2eeSetupComplete`, `room`, or `connectionDetails` change
- **Cleanup**: Remove event listeners when component unmounts

### useCallback - Optimizing Functions

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:57-68
const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
  setPreJoinChoices(values);
  const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
  // ... fetch connection details
}, []);
```

**Why use useCallback**:
- Prevents unnecessary re-renders
- Keeps function reference stable between renders
- Important for performance in large applications

### useMemo - Optimizing Calculations

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:135
const room = React.useMemo(() => new Room(roomOptions), []);
```

**Why use useMemo**:
- Only creates new Room when dependencies change
- Expensive operations should be memoized
- Prevents creating new Room instance on every render

## React Patterns in Our Project

### 1. Conditional Rendering

```tsx
// app/rooms/[roomName]/PageClientImpl.tsx:73-87
{connectionDetails === undefined || preJoinChoices === undefined ? (
  <PreJoin />
) : (
  <VideoConferenceComponent />
)}
```

**Pattern**: Show different UI based on state

### 2. List Rendering

```tsx
// app/page.tsx:18-33
let tabs = React.Children.map(props.children, (child, index) => {
  return (
    <button
      onClick={() => onTabSelected(index)}
      aria-pressed={tabIndex === index}
    >
      {child?.props.label}
    </button>
  );
});
```

**Pattern**: Transform array of data into array of components

### 3. Event Handling

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

**Pattern**: Define functions to handle user interactions

### 4. Form Handling

```tsx
// app/page.tsx:93-105
const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);
  const serverUrl = formData.get('serverUrl');
  const token = formData.get('token');
  // Process form...
};
```

**Pattern**: Prevent default form submission and handle data manually

## Component Composition

Our app uses component composition to build complex UIs:

```tsx
// app/page.tsx:164-186
<main className={styles.main}>
  <div className="header">
    <img src="/images/livekit-meet-home.svg" />
    <h2>Open source video conferencing app</h2>
  </div>
  <Suspense fallback="Loading">
    <Tabs>
      <DemoMeetingTab label="Demo" />
      <CustomConnectionTab label="Custom" />
    </Tabs>
  </Suspense>
</main>
```

**Hierarchy**:
- `main` contains the entire home page
  - `header` contains branding
  - `Suspense` handles loading states
    - `Tabs` manages tab switching
      - `DemoMeetingTab` handles demo meetings
      - `CustomConnectionTab` handles custom connections

## React Developer Tools

Install React Developer Tools browser extension to:
- Inspect component hierarchy
- View props and state
- Debug performance issues
- Track component re-renders

## Common React Mistakes (and How to Avoid Them)

### 1. Mutating State Directly
```tsx
// ❌ Wrong
const [items, setItems] = useState([]);
items.push(newItem); // Mutating state directly

// ✅ Correct
setItems([...items, newItem]); // Create new array
```

### 2. Missing Dependencies in useEffect
```tsx
// ❌ Wrong - missing dependency
useEffect(() => {
  doSomething(someValue);
}, []); // someValue changes but effect doesn't re-run

// ✅ Correct
useEffect(() => {
  doSomething(someValue);
}, [someValue]); // Include all dependencies
```

### 3. Not Preventing Default on Forms
```tsx
// ❌ Wrong - page will reload
const onSubmit = (event) => {
  // Process form
};

// ✅ Correct
const onSubmit = (event) => {
  event.preventDefault(); // Prevent page reload
  // Process form
};
```

## Why React is Powerful

1. **Component Reusability**: Write once, use everywhere
2. **Declarative**: Describe what UI should look like, not how to change it
3. **Virtual DOM**: Efficient updates only where needed
4. **Ecosystem**: Massive community and library ecosystem
5. **Developer Experience**: Great debugging tools and error messages

## Next Steps

Now that you understand React basics, let's explore how components and JSX work in detail with examples from our video conferencing app!

---

**Key Takeaways:**
- React builds UIs from reusable components
- Props pass data down, state manages component memory
- Hooks like useState and useEffect add functionality to components
- React automatically re-renders when state changes
- Component composition creates complex UIs from simple pieces

**Next**: [Components and JSX →](./05-components-jsx.md)