import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, describe, beforeEach } from 'vitest';
import { toast } from 'react-hot-toast';
import { ChannelManager } from './ChannelManager';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ChannelCreator component
vi.mock('./ChannelCreator', () => ({
  ChannelCreator: ({ onChannelCreated }: { onChannelCreated: (channel: any) => void }) => (
    <div data-testid="channel-creator">
      <button onClick={() => onChannelCreated({ id: 999, name: 'New Channel' })}>
        Mock Create Channel
      </button>
    </div>
  ),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.confirm
global.confirm = vi.fn();

describe('ChannelManager', () => {
  const mockOnChannelCreated = vi.fn();
  const mockOnChannelDeleted = vi.fn();
  const roomId = 1;

  const mockChannels = [
    {
      id: 1,
      name: 'Main Lobby',
      roomId: 1,
      isMainLobby: true,
      livekitRoomName: 'room_1_main_lobby',
      createdAt: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Team Alpha',
      roomId: 1,
      isMainLobby: false,
      livekitRoomName: 'room_1_channel_Team Alpha',
      createdAt: '2023-01-01T01:00:00Z',
    },
    {
      id: 3,
      name: 'Team Beta',
      roomId: 1,
      isMainLobby: false,
      livekitRoomName: 'room_1_channel_Team Beta',
      createdAt: '2023-01-01T02:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
    (global.confirm as any).mockReturnValue(true);
  });

  test('renders ChannelCreator component', () => {
    render(
      <ChannelManager
        roomId={roomId}
        channels={[]}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    expect(screen.getByTestId('channel-creator')).toBeInTheDocument();
  });

  test('displays team channels with delete buttons', () => {
    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    expect(screen.getByText('Manage Team Channels')).toBeInTheDocument();

    // Should show team channels (not main lobby)
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.queryByText('Main Lobby')).not.toBeInTheDocument();

    // Should have delete buttons for each team channel
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  test('does not show manage section when no team channels exist', () => {
    const onlyMainLobby = [mockChannels[0]]; // Only main lobby

    render(
      <ChannelManager
        roomId={roomId}
        channels={onlyMainLobby}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    expect(screen.queryByText('Manage Team Channels')).not.toBeInTheDocument();
  });

  test('deletes team channel successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    // Find and click delete button for Team Alpha
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation dialog
    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete the channel "Team Alpha"? This action cannot be undone.'
    );

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/channels/2',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-auth-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    await waitFor(() => {
      expect(mockOnChannelDeleted).toHaveBeenCalledWith(2);
      expect(toast.success).toHaveBeenCalledWith('Channel "Team Alpha" deleted successfully');
    });
  });

  test('prevents deletion of main lobby channel', async () => {
    const channelsWithMainLobby = [mockChannels[0]]; // Main lobby only

    render(
      <ChannelManager
        roomId={roomId}
        channels={channelsWithMainLobby}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    // Should not show any delete buttons since only main lobby exists
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('cancels deletion when user declines confirmation', async () => {
    (global.confirm as any).mockReturnValueOnce(false);

    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnChannelDeleted).not.toHaveBeenCalled();
  });

  test('handles API error during deletion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Only room creator can delete channels',
      }),
    });

    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Only room creator can delete channels');
      expect(mockOnChannelDeleted).not.toHaveBeenCalled();
    });
  });

  test('disables delete button during deletion', async () => {
    // Make fetch hang to test loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  test('handles channel creation callback', () => {
    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    // Trigger the mock channel creator
    const mockCreateButton = screen.getByText('Mock Create Channel');
    fireEvent.click(mockCreateButton);

    expect(mockOnChannelCreated).toHaveBeenCalledWith({ id: 999, name: 'New Channel' });
  });

  test('handles network error during deletion', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  test('shows correct channel names and symbols', () => {
    render(
      <ChannelManager
        roomId={roomId}
        channels={mockChannels}
        onChannelCreated={mockOnChannelCreated}
        onChannelDeleted={mockOnChannelDeleted}
      />
    );

    // Team channels should have # symbol
    const teamAlphaRow = screen.getByText('Team Alpha').closest('div');
    const teamBetaRow = screen.getByText('Team Beta').closest('div');

    expect(teamAlphaRow).toHaveTextContent('#Team Alpha');
    expect(teamBetaRow).toHaveTextContent('#Team Beta');
  });
});