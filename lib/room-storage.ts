import { promises as fs } from 'fs';
import path from 'path';
import { generateRoomId } from './client-utils';

export interface RoomMetadata {
  roomId: string;
  adminUserId: string;
  displayName: string;
  createdAt: string;
  lastActivity: string;
}

export interface Channel {
  channelId: string;
  displayName: string;
  livekitRoomName: string;
  createdAt: string;
  createdBy: string;
}

export interface ChannelRegistry {
  roomId: string;
  channels: Channel[];
}

export class RoomFileStorage {
  private static ROOMS_DIR = path.join(process.cwd(), 'docs', 'rooms');

  static async createRoom(roomId: string, adminUserId: string, displayName: string): Promise<RoomMetadata> {
    console.log('💾 RoomFileStorage: Creating room', { roomId, adminUserId, displayName });

    const roomPath = path.join(this.ROOMS_DIR, roomId);
    console.log('💾 RoomFileStorage: Creating directory', { roomPath });

    await fs.mkdir(roomPath, { recursive: true });

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

    const channelRegistry: ChannelRegistry = {
      roomId,
      channels: [defaultChannel]
    };

    console.log('💾 RoomFileStorage: Writing metadata and channels', { metadata, channelRegistry });

    await Promise.all([
      fs.writeFile(path.join(roomPath, 'metadata.json'), JSON.stringify(metadata, null, 2)),
      fs.writeFile(path.join(roomPath, 'channels.json'), JSON.stringify(channelRegistry, null, 2))
    ]);

    console.log('💾 RoomFileStorage: Room created successfully', { roomId });
    return metadata;
  }

  static async getRoomMetadata(roomId: string): Promise<RoomMetadata | null> {
    try {
      const metadataPath = path.join(this.ROOMS_DIR, roomId, 'metadata.json');
      const metadata = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(metadata);
    } catch (error) {
      return null;
    }
  }

  static async getChannels(roomId: string): Promise<Channel[]> {
    try {
      const channelsPath = path.join(this.ROOMS_DIR, roomId, 'channels.json');
      const channelsData = await fs.readFile(channelsPath, 'utf-8');
      const registry: ChannelRegistry = JSON.parse(channelsData);
      return registry.channels;
    } catch (error) {
      return [];
    }
  }

  static async addChannel(roomId: string, displayName: string, creatorId: string): Promise<Channel> {
    const channelId = displayName.toLowerCase() === 'main lobby' ? 'main-lobby' : generateRoomId();

    const newChannel: Channel = {
      channelId,
      displayName,
      livekitRoomName: `${roomId}_${channelId}`,
      createdAt: new Date().toISOString(),
      createdBy: creatorId
    };

    const channelsPath = path.join(this.ROOMS_DIR, roomId, 'channels.json');
    const channelsData = JSON.parse(await fs.readFile(channelsPath, 'utf-8'));
    channelsData.channels.push(newChannel);

    await fs.writeFile(channelsPath, JSON.stringify(channelsData, null, 2));

    return newChannel;
  }
}

export class AdminIdentityManager {
  static getUserId(): string {
    if (typeof window !== 'undefined') {
      let userId = localStorage.getItem('livekit-user-id');
      if (!userId) {
        userId = generateRoomId();
        localStorage.setItem('livekit-user-id', userId);
        console.log('👤 AdminIdentityManager: Created new user ID', { userId });
      } else {
        console.log('👤 AdminIdentityManager: Retrieved existing user ID', { userId });
      }
      return userId;
    }
    const serverUserId = generateRoomId();
    console.log('👤 AdminIdentityManager: Server-side user ID generated', { serverUserId });
    return serverUserId;
  }

  static async isRoomAdmin(roomId: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      console.log('👤 AdminIdentityManager: Server-side check, returning false', { roomId });
      return false;
    }

    const userId = this.getUserId();
    console.log('👤 AdminIdentityManager: Checking admin status', { roomId, userId });

    try {
      const response = await fetch(`/api/rooms/${roomId}/metadata`);
      if (!response.ok) {
        console.log('👤 AdminIdentityManager: Room not found', { roomId, status: response.status });
        return false;
      }
      const metadata = await response.json();
      const isAdmin = metadata?.adminUserId === userId;
      console.log('👤 AdminIdentityManager: Admin check result', { roomId, userId, adminUserId: metadata?.adminUserId, isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('👤 AdminIdentityManager: Error checking admin status', { roomId, userId, error });
      return false;
    }
  }
}