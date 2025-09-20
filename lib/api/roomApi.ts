import { apiClient } from './apiClient';

// Types based on the story requirements
export interface Room {
  id: number;
  name: string;
  accessToken: string;
  creatorId: number;
  isActive: boolean;
  createdAt: string;
  creator?: User;
  channels?: Channel[];
  members?: User[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface Channel {
  id: number;
  name: string;
  roomId: number;
  isMainLobby: boolean;
  livekitRoomName: string;
  createdAt: string;
}

export interface RoomCreation {
  name: string;
}

export interface CreateRoomResponse {
  message: string;
  room: Room;
  accessToken: string;
}

export interface GetRoomsResponse {
  rooms: Room[];
}

export interface GetRoomResponse {
  room: Room;
}

export interface DeleteRoomResponse {
  message: string;
}

// Room API functions
export const roomApi = {
  // Create a new room
  async createRoom(roomData: RoomCreation): Promise<CreateRoomResponse> {
    return apiClient.post<CreateRoomResponse>('/api/rooms', roomData);
  },

  // Get all rooms for the authenticated user
  async getUserRooms(): Promise<GetRoomsResponse> {
    return apiClient.get<GetRoomsResponse>('/api/rooms');
  },

  // Get a specific room by ID
  async getRoom(roomId: number): Promise<GetRoomResponse> {
    return apiClient.get<GetRoomResponse>(`/api/rooms/${roomId}`);
  },

  // Delete a room (only by creator)
  async deleteRoom(roomId: number): Promise<DeleteRoomResponse> {
    return apiClient.delete<DeleteRoomResponse>(`/api/rooms/${roomId}`);
  }
};

export default roomApi;