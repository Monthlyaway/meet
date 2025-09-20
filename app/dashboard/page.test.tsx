import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import DashboardPage from './page';

// Mock modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/auth/ProtectedRoute', () => ({
  default: function ProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  },
}));

vi.mock('@/lib/gaming/RoomCreator', () => ({
  default: function RoomCreator({ onRoomCreated, onError }: any) {
    return (
      <div data-testid="room-creator">
        <button onClick={() => onRoomCreated({ name: 'Test Room' }, 'test-token')}>
          Create Room
        </button>
      </div>
    );
  },
}));

vi.mock('@/lib/gaming/RoomList', () => ({
  default: function RoomList({ onError }: any) {
    return <div data-testid="room-list">Room List</div>;
  },
}));

const mockPush = vi.fn();
const mockLogout = vi.fn();
const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);

describe('DashboardPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLogout.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' },
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
    });
  });

  it('renders dashboard with gaming styling', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Gaming Voice Chat')).toBeInTheDocument();
    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    expect(screen.getAllByText('Join Room')).toHaveLength(2); // Header and button
    expect(screen.getByText('Use an access token to join an existing gaming room.')).toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    render(<DashboardPage />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to join room page', () => {
    render(<DashboardPage />);

    const joinRoomButton = screen.getByRole('button', { name: 'Join Room' });
    fireEvent.click(joinRoomButton);

    expect(mockPush).toHaveBeenCalledWith('/join-room');
  });

  it('displays success message when room is created', () => {
    render(<DashboardPage />);

    const createRoomButton = screen.getByText('Create Room');
    fireEvent.click(createRoomButton);

    expect(screen.getByText('Room "Test Room" created successfully!')).toBeInTheDocument();
  });

  it('displays room creator and room list components', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('room-creator')).toBeInTheDocument();
    expect(screen.getByTestId('room-list')).toBeInTheDocument();
  });

  it('applies correct CSS classes for gaming theme', () => {
    const { container } = render(<DashboardPage />);

    // Check for gaming-specific CSS classes
    expect(container.querySelector('[class*="dashboardContainer"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="header"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="card"]')).toBeInTheDocument();
  });
});