import { NextRequest } from 'next/server';
import { RoomFileStorage } from '@/lib/room-storage-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, adminUserId, displayName } = body;

    console.log('🔗 API /rooms POST: Received room creation request', { roomId, adminUserId, displayName });

    if (!roomId || !adminUserId || !displayName) {
      console.error('🔗 API /rooms POST: Missing required fields', { roomId, adminUserId, displayName });
      return Response.json(
        { error: 'Missing required fields: roomId, adminUserId, displayName' },
        { status: 400 }
      );
    }

    const roomMetadata = await RoomFileStorage.createRoom(roomId, adminUserId, displayName);
    console.log('🔗 API /rooms POST: Room created successfully', { roomMetadata });

    return Response.json({
      success: true,
      roomMetadata
    });
  } catch (error) {
    console.error('🔗 API /rooms POST: Room creation error:', error);
    return Response.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}