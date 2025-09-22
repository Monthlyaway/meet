import { NextRequest } from 'next/server';
import { RoomFileStorage } from '@/lib/room-storage-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const metadata = await RoomFileStorage.getRoomMetadata(roomId);

    if (!metadata) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return Response.json(metadata);
  } catch (error) {
    console.error('Get room metadata error:', error);
    return Response.json(
      { error: 'Failed to get room metadata' },
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

    const existingMetadata = await RoomFileStorage.getRoomMetadata(roomId);
    if (!existingMetadata) {
      return Response.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const updatedMetadata = {
      ...existingMetadata,
      ...body,
      roomId,
      lastActivity: new Date().toISOString()
    };

    const roomPath = require('path').join(process.cwd(), 'docs', 'rooms', roomId);
    const metadataPath = require('path').join(roomPath, 'metadata.json');

    await require('fs').promises.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return Response.json({
      success: true,
      metadata: updatedMetadata
    });
  } catch (error) {
    console.error('Update room metadata error:', error);
    return Response.json(
      { error: 'Failed to update room metadata' },
      { status: 500 }
    );
  }
}