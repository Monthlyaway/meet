import { NextRequest } from 'next/server';
import { RoomFileStorage } from '@/lib/room-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    console.log('📡 Channels API: GET request', { roomId });

    const channels = await RoomFileStorage.getChannels(roomId);

    console.log('📡 Channels API: Retrieved channels', { roomId, channelCount: channels.length });

    return Response.json({
      roomId,
      channels
    });
  } catch (error) {
    console.error('📡 Channels API: GET error', error);
    return Response.json(
      { error: 'Failed to get channels' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { displayName, creatorId } = body;

    console.log('📡 Channels API: POST request', { roomId, displayName, creatorId });

    // Validate required fields
    if (!displayName || typeof displayName !== 'string') {
      return Response.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (!creatorId || typeof creatorId !== 'string') {
      return Response.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Validate room exists
    const roomMetadata = await RoomFileStorage.getRoomMetadata(roomId);
    if (!roomMetadata) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Validate creator is admin
    if (roomMetadata.adminUserId !== creatorId) {
      return Response.json(
        { error: 'Only room admin can create channels' },
        { status: 403 }
      );
    }

    // Validate display name
    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return Response.json(
        { error: 'Channel name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      return Response.json(
        { error: 'Channel name can only contain letters, numbers, spaces, hyphens, and underscores' },
        { status: 400 }
      );
    }

    // Check for duplicate names
    const existingChannels = await RoomFileStorage.getChannels(roomId);
    const duplicateChannel = existingChannels.find(
      channel => channel.displayName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateChannel) {
      return Response.json(
        { error: 'Channel with this name already exists' },
        { status: 409 }
      );
    }

    // Create new channel
    const newChannel = await RoomFileStorage.addChannel(roomId, trimmedName, creatorId);

    console.log('📡 Channels API: Channel created successfully', {
      roomId,
      channelId: newChannel.channelId,
      displayName: newChannel.displayName
    });

    return Response.json({
      success: true,
      channel: newChannel
    });

  } catch (error) {
    console.error('📡 Channels API: POST error', error);
    return Response.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}