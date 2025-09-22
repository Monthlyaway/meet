import { NextRequest } from 'next/server';
import { RoomFileStorage } from '@/lib/room-storage-server';
import { promises as fs } from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; channelId: string }> }
) {
  try {
    const { roomId, channelId } = await params;

    console.log('📡 Channel DELETE API: Request received', { roomId, channelId });

    // Validate room exists
    const roomMetadata = await RoomFileStorage.getRoomMetadata(roomId);
    if (!roomMetadata) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Get current channels
    const channels = await RoomFileStorage.getChannels(roomId);
    const channelToDelete = channels.find(c => c.channelId === channelId);

    if (!channelToDelete) {
      return Response.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of main-lobby channel
    if (channelId === 'main-lobby') {
      return Response.json(
        { error: 'Cannot delete the main lobby channel' },
        { status: 400 }
      );
    }

    // Get requestor ID from query params or body
    const url = new URL(request.url);
    const requestorId = url.searchParams.get('requestorId');

    if (!requestorId) {
      return Response.json(
        { error: 'Requestor ID is required' },
        { status: 400 }
      );
    }

    // Validate requestor is admin
    if (roomMetadata.adminUserId !== requestorId) {
      return Response.json(
        { error: 'Only room admin can delete channels' },
        { status: 403 }
      );
    }

    // Remove channel from list
    const updatedChannels = channels.filter(c => c.channelId !== channelId);

    // Update channels file
    const ROOMS_DIR = path.join(process.cwd(), 'docs', 'rooms');
    const channelsPath = path.join(ROOMS_DIR, roomId, 'channels.json');

    const channelRegistry = {
      roomId,
      channels: updatedChannels
    };

    await fs.writeFile(channelsPath, JSON.stringify(channelRegistry, null, 2));

    console.log('📡 Channel DELETE API: Channel deleted successfully', {
      roomId,
      channelId,
      deletedChannel: channelToDelete.displayName,
      remainingChannels: updatedChannels.length
    });

    return Response.json({
      success: true,
      deletedChannel: channelToDelete,
      remainingChannels: updatedChannels.length
    });

  } catch (error) {
    console.error('📡 Channel DELETE API: Error', error);
    return Response.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}