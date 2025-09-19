import { render, screen, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthContext';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with unauthenticated state', async () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles login successfully', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };
    const mockToken = 'mock-jwt-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth-token', mockToken);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth-user', JSON.stringify(mockUser));
  });

  it('handles login failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await expect(
      act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('handles registration successfully', async () => {
    const mockUser = {
      id: 1,
      username: 'newuser',
      email: 'new@example.com',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };
    const mockToken = 'mock-jwt-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
  });

  it('handles logout correctly', async () => {
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    // First set authenticated state
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-user');
  });

  it('restores session from localStorage on initialization', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };
    const mockToken = 'stored-jwt-token';

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auth-token') return mockToken;
      if (key === 'auth-user') return JSON.stringify(mockUser);
      return null;
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
    });
  });

  it('clears invalid token from localStorage', async () => {
    const mockToken = 'invalid-jwt-token';

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auth-token') return mockToken;
      if (key === 'auth-user') return JSON.stringify({ id: 1 });
      return null;
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth-user');
    });
  });
});