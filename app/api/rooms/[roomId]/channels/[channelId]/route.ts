import { NextRequest } from 'next/server';
import { RoomMemoryStorage } from '@/lib/room-storage-memory';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; channelId: string }> }
) {
  try {
    const { roomId, channelId } = await params;

    console.log('📡 Channel DELETE API: Request received', { roomId, channelId });

    // Validate room exists
    const roomMetadata = await RoomMemoryStorage.getRoomMetadata(roomId);
    if (!roomMetadata) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Get current channels
    const channels = await RoomMemoryStorage.getChannels(roomId);
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

    // Get requestor ID from query params
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

    // Delete channel from memory
    const deleted = await RoomMemoryStorage.deleteChannel(roomId, channelId);

    if (!deleted) {
      return Response.json(
        { error: 'Failed to delete channel' },
        { status: 500 }
      );
    }

    // Get updated channel count
    const remainingChannels = await RoomMemoryStorage.getChannels(roomId);

    console.log('📡 Channel DELETE API: Channel deleted successfully', {
      roomId,
      channelId,
      deletedChannel: channelToDelete.displayName,
      remainingChannels: remainingChannels.length
    });

    return Response.json({
      success: true,
      deletedChannel: channelToDelete,
      remainingChannels: remainingChannels.length
    });

  } catch (error) {
    console.error('📡 Channel DELETE API: Error', error);
    return Response.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}