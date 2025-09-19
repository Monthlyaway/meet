/**
 * API endpoint definitions for the gaming voice chat platform
 * Based on authentication endpoints from Story 1.2
 */

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  VALIDATE: '/api/auth/validate',
  REFRESH: '/api/auth/refresh', // For future token refresh functionality
} as const;

// User endpoints (for future user management features)
export const USER_ENDPOINTS = {
  PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  DELETE_ACCOUNT: '/api/users/account',
} as const;

// Room endpoints (for future gaming room features from Epic 1)
export const ROOM_ENDPOINTS = {
  LIST: '/api/rooms',
  CREATE: '/api/rooms',
  JOIN: '/api/rooms/join',
  LEAVE: '/api/rooms/leave',
  DELETE: '/api/rooms',
  GET_BY_ID: (id: string) => `/api/rooms/${id}`,
  GET_MEMBERS: (id: string) => `/api/rooms/${id}/members`,
} as const;

// Channel endpoints (for future team channel features from Epic 1)
export const CHANNEL_ENDPOINTS = {
  LIST: (roomId: string) => `/api/rooms/${roomId}/channels`,
  CREATE: (roomId: string) => `/api/rooms/${roomId}/channels`,
  JOIN: (channelId: string) => `/api/channels/${channelId}/join`,
  LEAVE: (channelId: string) => `/api/channels/${channelId}/leave`,
  DELETE: (channelId: string) => `/api/channels/${channelId}`,
} as const;

// Health check endpoint
export const HEALTH_ENDPOINTS = {
  CHECK: '/api/health',
} as const;

// Utility function to build URLs with query parameters
export function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  if (!params) return endpoint;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });

  return `${endpoint}?${searchParams.toString()}`;
}

// Type definitions for endpoint responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Common response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export default {
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  ROOM_ENDPOINTS,
  CHANNEL_ENDPOINTS,
  HEALTH_ENDPOINTS,
  buildUrl,
};