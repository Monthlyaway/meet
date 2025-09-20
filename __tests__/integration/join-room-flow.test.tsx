import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { apiClient } from '@/lib/api/apiClient';
import JoinRoomPage from '@/app/(dashboard)/join-room/page';

// Mock modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api/apiClient', () => ({
  apiClient: {
    joinRoom: vi.fn(),
  },
}));

const mockPush = vi.fn();
const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);
const mockJoinRoom = vi.mocked(apiClient.joinRoom);

describe('Join Room Flow Integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockJoinRoom.mockClear();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('redirects to gaming room interface on successful join', async () => {
    const mockJoinResponse = {
      message: 'Room joined successfully',
      room: {
        id: 123,
        name: 'Test Gaming Room',
        creator_id: 1,
        channels: [
          {
            id: 1,
            name: 'Main Lobby',
            is_main_lobby: true,
            livekit_room_name: 'test-room-main-lobby'
          },
          {
            id: 2,
            name: 'Team Alpha',
            is_main_lobby: false,
            livekit_room_name: 'test-room-team-alpha'
          }
        ]
      },
      livekitRoomName: 'test-room-main-lobby'
    };

    mockJoinRoom.mockResolvedValue(mockJoinResponse);

    render(<JoinRoomPage />);

    const tokenInput = screen.getByLabelText('Room Access Token');
    const joinButton = screen.getByRole('button', { name: 'Join Room' });

    fireEvent.change(tokenInput, { target: { value: 'valid-access-token' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('valid-access-token');
      // Verify redirect to gaming room interface with room ID
      expect(mockPush).toHaveBeenCalledWith('/gaming/rooms/123?joined=true');
    });
  });

  it('handles room without main lobby channel gracefully', async () => {
    const mockJoinResponse = {
      message: 'Room joined successfully',
      room: {
        id: 456,
        name: 'Test Room No Lobby',
        creator_id: 1,
        channels: [
          {
            id: 3,
            name: 'General',
            is_main_lobby: false,
            livekit_room_name: 'test-room-general'
          }
        ]
      },
      livekitRoomName: 'test-room-general'
    };

    mockJoinRoom.mockResolvedValue(mockJoinResponse);

    render(<JoinRoomPage />);

    const tokenInput = screen.getByLabelText('Room Access Token');
    const joinButton = screen.getByRole('button', { name: 'Join Room' });

    fireEvent.change(tokenInput, { target: { value: 'valid-token-no-lobby' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Main lobby channel not found')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('shows error for invalid access token', async () => {
    mockJoinRoom.mockRejectedValue(new Error('404: Invalid access token'));

    render(<JoinRoomPage />);

    const tokenInput = screen.getByLabelText('Room Access Token');
    const joinButton = screen.getByRole('button', { name: 'Join Room' });

    fireEvent.change(tokenInput, { target: { value: 'invalid-token' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid access token. Please check and try again.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('validates access token format before submission', async () => {
    render(<JoinRoomPage />);

    const tokenInput = screen.getByLabelText('Room Access Token');
    const joinButton = screen.getByRole('button', { name: 'Join Room' });

    // Try submitting with short token
    fireEvent.change(tokenInput, { target: { value: 'short' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid access token')).toBeInTheDocument();
      expect(mockJoinRoom).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('maintains team channel functionality in gaming room interface', async () => {
    const mockJoinResponse = {
      message: 'Room joined successfully',
      room: {
        id: 789,
        name: 'Multi-Channel Gaming Room',
        creator_id: 1,
        channels: [
          {
            id: 10,
            name: 'Main Lobby',
            is_main_lobby: true,
            livekit_room_name: 'multi-room-main'
          },
          {
            id: 11,
            name: 'Team Alpha',
            is_main_lobby: false,
            livekit_room_name: 'multi-room-alpha'
          },
          {
            id: 12,
            name: 'Team Beta',
            is_main_lobby: false,
            livekit_room_name: 'multi-room-beta'
          }
        ]
      },
      livekitRoomName: 'multi-room-main'
    };

    mockJoinRoom.mockResolvedValue(mockJoinResponse);

    render(<JoinRoomPage />);

    const tokenInput = screen.getByLabelText('Room Access Token');
    const joinButton = screen.getByRole('button', { name: 'Join Room' });

    fireEvent.change(tokenInput, { target: { value: 'multi-channel-token' } });
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('multi-channel-token');
      // Verify redirect includes room ID for gaming interface
      expect(mockPush).toHaveBeenCalledWith('/gaming/rooms/789?joined=true');
    });
  });
});