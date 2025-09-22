import { generateRoomId } from './client-utils';
import { RoomMetadata, Channel, ChannelRegistry } from './types';

// In-memory storage for Vercel deployment
// WARNING: Data will be lost when serverless functions restart
const memoryStorage = new Map<string, {
  metadata: RoomMetadata;
  channels: Channel[];
}>();

export class RoomMemoryStorage {
  static async createRoom(roomId: string, adminUserId: string, displayName: string): Promise<RoomMetadata> {
    console.log('🧠 RoomMemoryStorage: Creating room', { roomId, adminUserId, displayName });

    const metadata: RoomMetadata = {
      roomId,
      adminUserId,
      displayName,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    const defaultChannel: Channel = {
      channelId: 'main-lobby',
      displayName: 'Main Lobby',
      livekitRoomName: `${roomId}_main-lobby`,
      createdAt: new Date().toISOString(),
      createdBy: adminUserId
    };

    // Store in memory
    memoryStorage.set(roomId, {
      metadata,
      channels: [defaultChannel]
    });

    console.log('🧠 RoomMemoryStorage: Room created successfully', { roomId });
    return metadata;
  }

  static async getRoomMetadata(roomId: string): Promise<RoomMetadata | null> {
    const room = memoryStorage.get(roomId);
    return room ? room.metadata : null;
  }

  static async getChannels(roomId: string): Promise<Channel[]> {
    const room = memoryStorage.get(roomId);
    return room ? room.channels : [];
  }

  static async addChannel(roomId: string, displayName: string, creatorId: string): Promise<Channel> {
    const room = memoryStorage.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const channelId = displayName.toLowerCase() === 'main lobby' ? 'main-lobby' : generateRoomId();

    const newChannel: Channel = {
      channelId,
      displayName,
      livekitRoomName: `${roomId}_${channelId}`,
      createdAt: new Date().toISOString(),
      createdBy: creatorId
    };

    room.channels.push(newChannel);
    memoryStorage.set(roomId, room);

    return newChannel;
  }
}