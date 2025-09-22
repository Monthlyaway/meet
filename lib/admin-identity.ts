import { generateRoomId } from './client-utils';

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