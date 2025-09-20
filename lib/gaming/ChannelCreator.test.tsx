import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, test, describe, beforeEach } from 'vitest';
import { toast } from 'react-hot-toast';
import { ChannelCreator } from './ChannelCreator';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('ChannelCreator', () => {
  const mockOnChannelCreated = vi.fn();
  const roomId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
  });

  test('renders channel creation form correctly', () => {
    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    expect(screen.getByText('Create Team Channel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter channel name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  test('creates channel successfully', async () => {
    const mockChannel = {
      id: 1,
      name: 'Team Alpha',
      roomId: 1,
      isMainLobby: false,
      livekitRoomName: 'room_1_channel_Team Alpha',
      createdAt: '2023-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Channel created successfully',
        channel: mockChannel,
      }),
    });

    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const createButton = screen.getByRole('button', { name: 'Create' });

    // Enter channel name
    fireEvent.change(input, { target: { value: 'Team Alpha' } });
    expect(input).toHaveValue('Team Alpha');

    // Submit form
    fireEvent.click(createButton);

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/rooms/1/channels',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-auth-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Team Alpha' }),
      }
    );

    await waitFor(() => {
      expect(mockOnChannelCreated).toHaveBeenCalledWith(mockChannel);
      expect(toast.success).toHaveBeenCalledWith('Channel "Team Alpha" created successfully');
      expect(input).toHaveValue(''); // Form should be reset
    });
  });

  test('shows error when channel name is empty', async () => {
    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const form = input.closest('form');

    // Ensure we have a form
    expect(form).toBeInTheDocument();

    // Try to submit form with empty input
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Channel name is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  test('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Only room creator can create channels',
      }),
    });

    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const createButton = screen.getByRole('button', { name: 'Create' });

    fireEvent.change(input, { target: { value: 'Team Alpha' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Only room creator can create channels');
      expect(mockOnChannelCreated).not.toHaveBeenCalled();
    });
  });

  test('disables form during creation', async () => {
    // Make fetch hang to test loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const createButton = screen.getByRole('button', { name: 'Create' });

    fireEvent.change(input, { target: { value: 'Team Alpha' } });
    fireEvent.click(createButton);

    // Check that form is disabled during creation
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument();
      expect(input).toBeDisabled();
    });
  });

  test('validates channel name length', () => {
    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');

    // Test minimum length validation
    expect(input).toHaveAttribute('minLength', '1');
    expect(input).toHaveAttribute('maxLength', '100');
  });

  test('trims whitespace from channel name', async () => {
    const mockChannel = {
      id: 1,
      name: 'Team Alpha',
      roomId: 1,
      isMainLobby: false,
      livekitRoomName: 'room_1_channel_Team Alpha',
      createdAt: '2023-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Channel created successfully',
        channel: mockChannel,
      }),
    });

    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const createButton = screen.getByRole('button', { name: 'Create' });

    // Enter channel name with whitespace
    fireEvent.change(input, { target: { value: '  Team Alpha  ' } });
    fireEvent.click(createButton);

    // Verify trimmed name is sent to API
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/rooms/1/channels',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Team Alpha' }),
      })
    );
  });

  test('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ChannelCreator roomId={roomId} onChannelCreated={mockOnChannelCreated} />);

    const input = screen.getByPlaceholderText('Enter channel name');
    const createButton = screen.getByRole('button', { name: 'Create' });

    fireEvent.change(input, { target: { value: 'Team Alpha' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });
});