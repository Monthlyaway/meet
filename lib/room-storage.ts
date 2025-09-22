// Conditional storage for Vercel deployment
// Use memory storage on Vercel, file storage locally

import { RoomMetadata, Channel } from './types';

// Check if we're on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1';

let RoomStorage: any;

if (isVercel) {
  // Use memory storage on Vercel
  import('./room-storage-memory').then(module => {
    RoomStorage = module.RoomMemoryStorage;
  });
} else {
  // Use file storage locally
  import('./room-storage-server').then(module => {
    RoomStorage = module.RoomFileStorage;
  });
}

// Wrapper class that delegates to the appropriate storage
export class RoomFileStorage {
  static async createRoom(roomId: string, adminUserId: string, displayName: string): Promise<RoomMetadata> {
    if (isVercel) {
      const { RoomMemoryStorage } = await import('./room-storage-memory');
      return RoomMemoryStorage.createRoom(roomId, adminUserId, displayName);
    } else {
      const { RoomFileStorage } = await import('./room-storage-server');
      return RoomFileStorage.createRoom(roomId, adminUserId, displayName);
    }
  }

  static async getRoomMetadata(roomId: string): Promise<RoomMetadata | null> {
    if (isVercel) {
      const { RoomMemoryStorage } = await import('./room-storage-memory');
      return RoomMemoryStorage.getRoomMetadata(roomId);
    } else {
      const { RoomFileStorage } = await import('./room-storage-server');
      return RoomFileStorage.getRoomMetadata(roomId);
    }
  }

  static async getChannels(roomId: string): Promise<Channel[]> {
    if (isVercel) {
      const { RoomMemoryStorage } = await import('./room-storage-memory');
      return RoomMemoryStorage.getChannels(roomId);
    } else {
      const { RoomFileStorage } = await import('./room-storage-server');
      return RoomFileStorage.getChannels(roomId);
    }
  }

  static async addChannel(roomId: string, displayName: string, creatorId: string): Promise<Channel> {
    if (isVercel) {
      const { RoomMemoryStorage } = await import('./room-storage-memory');
      return RoomMemoryStorage.addChannel(roomId, displayName, creatorId);
    } else {
      const { RoomFileStorage } = await import('./room-storage-server');
      return RoomFileStorage.addChannel(roomId, displayName, creatorId);
    }
  }
}