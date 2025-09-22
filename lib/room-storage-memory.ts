import { generateRoomId } from './client-utils';
import { RoomMetadata, Channel, ChannelRegistry } from './types';

// In-memory storage for Vercel deployment
// WARNING: Data will be lost when serverless functions restart
// Use global to persist across function invocations in same process
declare global {
  var __ROOM_MEMORY_STORAGE__: Map<string, {
    metadata: RoomMetadata;
    channels: Channel[];
  }> | undefined;
}

const memoryStorage = global.__ROOM_MEMORY_STORAGE__ ?? new Map<string, {
  metadata: RoomMetadata;
  channels: Channel[];
}>();

// Always assign to global to persist across function calls
global.__ROOM_MEMORY_STORAGE__ = memoryStorage;

export class RoomMemoryStorage {
  static async createRoom(roomId: string, adminUserId: string, displayName: string): Promise<RoomMetadata> {
    console.log('🧠 RoomMemoryStorage: Creating room', { roomId, adminUserId, displayName });
    console.log('🧠 RoomMemoryStorage: Current memory storage keys before create:', Array.from(memoryStorage.keys()));

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
    console.log('🧠 RoomMemoryStorage: Current memory storage keys after create:', Array.from(memoryStorage.keys()));
    console.log('🧠 RoomMemoryStorage: Memory storage size:', memoryStorage.size);
    return metadata;
  }

  static async getRoomMetadata(roomId: string): Promise<RoomMetadata | null> {
    console.log('🧠 RoomMemoryStorage: Getting room metadata', { roomId });
    console.log('🧠 RoomMemoryStorage: Current memory storage keys:', Array.from(memoryStorage.keys()));
    console.log('🧠 RoomMemoryStorage: Memory storage size:', memoryStorage.size);

    const room = memoryStorage.get(roomId);
    console.log('🧠 RoomMemoryStorage: Found room:', !!room);

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

  static async deleteChannel(roomId: string, channelId: string): Promise<boolean> {
    const room = memoryStorage.get(roomId);
    if (!room) {
      return false;
    }

    const initialLength = room.channels.length;
    room.channels = room.channels.filter(c => c.channelId !== channelId);

    if (room.channels.length < initialLength) {
      memoryStorage.set(roomId, room);
      return true;
    }

    return false;
  }
}