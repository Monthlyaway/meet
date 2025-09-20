import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RoomCreator from './RoomCreator';
import * as roomApi from '@/lib/api/roomApi';

// Mock the room API
vi.mock('@/lib/api/roomApi', () => ({
  roomApi: {
    createRoom: vi.fn(),
  },
}));

describe('RoomCreator', () => {
  const mockOnRoomCreated = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    expect(screen.getByText('Create Gaming Room')).toBeInTheDocument();
    expect(screen.getByText('Start a new voice chat room for your gaming session.')).toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeInTheDocument();
  });

  it('shows form when create room button is clicked', () => {
    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    fireEvent.click(screen.getByText('Create Room'));

    expect(screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)')).toBeInTheDocument();
    expect(screen.getByText('0/100 characters')).toBeInTheDocument();
  });

  it('validates room name input', async () => {
    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    // Open form
    fireEvent.click(screen.getByText('Create Room'));

    const input = screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)');
    const createButton = screen.getByText('Create Room');

    // Test empty input - submit form
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Room name is required');
    });

    // Test short input
    fireEvent.change(input, { target: { value: 'AB' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Room name must be between 3 and 100 characters');
    });

    // Clear mocks
    mockOnError.mockClear();

    // Test valid input
    fireEvent.change(input, { target: { value: 'Valid Room Name' } });
    expect(screen.getByText('15/100 characters')).toBeInTheDocument();
  });

  it('creates room successfully', async () => {
    const mockRoom = {
      id: 1,
      name: 'Test Room',
      accessToken: 'test-token-123',
      creatorId: 1,
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      message: 'Room created successfully',
      room: mockRoom,
      accessToken: 'test-token-123',
    };

    vi.mocked(roomApi.roomApi.createRoom).mockResolvedValue(mockResponse);

    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    // Open form and fill input
    fireEvent.click(screen.getByText('Create Room'));
    const input = screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)');
    fireEvent.change(input, { target: { value: 'Test Room' } });

    // Submit form
    fireEvent.click(screen.getByText('Create Room'));

    await waitFor(() => {
      expect(roomApi.roomApi.createRoom).toHaveBeenCalledWith({ name: 'Test Room' });
      expect(mockOnRoomCreated).toHaveBeenCalledWith(mockRoom, 'test-token-123');
    });

    // Should show success state
    expect(screen.getByText('Room Created Successfully! 🎉')).toBeInTheDocument();
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('test-token-123')).toBeInTheDocument();
  });

  it('handles room creation error', async () => {
    const errorMessage = 'Failed to create room';
    vi.mocked(roomApi.roomApi.createRoom).mockRejectedValue(new Error(errorMessage));

    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    // Open form and fill input
    fireEvent.click(screen.getByText('Create Room'));
    const input = screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)');
    fireEvent.change(input, { target: { value: 'Test Room' } });

    // Submit form
    fireEvent.click(screen.getByText('Create Room'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('allows copying access token', () => {
    // Mock clipboard API
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    const mockRoom = {
      id: 1,
      name: 'Test Room',
      accessToken: 'test-token-123',
      creatorId: 1,
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      message: 'Room created successfully',
      room: mockRoom,
      accessToken: 'test-token-123',
    };

    vi.mocked(roomApi.roomApi.createRoom).mockResolvedValue(mockResponse);

    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    // Create room first
    fireEvent.click(screen.getByText('Create Room'));
    const input = screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)');
    fireEvent.change(input, { target: { value: 'Test Room' } });
    fireEvent.click(screen.getByText('Create Room'));

    waitFor(() => {
      // Click copy button
      fireEvent.click(screen.getByText('Copy'));
      expect(mockWriteText).toHaveBeenCalledWith('test-token-123');
    });
  });

  it('cancels form creation', () => {
    render(<RoomCreator onRoomCreated={mockOnRoomCreated} onError={mockOnError} />);

    // Open form
    fireEvent.click(screen.getByText('Create Room'));
    expect(screen.getByPlaceholderText('Enter room name (e.g., Squad Gaming Session)')).toBeInTheDocument();

    // Cancel form
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Enter room name (e.g., Squad Gaming Session)')).not.toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeInTheDocument();
  });
});