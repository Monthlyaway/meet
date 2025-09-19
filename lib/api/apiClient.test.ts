import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { apiClient } from './apiClient';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// localStorage is mocked in vitest.setup.ts

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes GET request without token', async () => {
    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('makes GET request with token', async () => {
    const mockToken = 'test-token';
    localStorage.getItem.mockReturnValue(mockToken);

    const mockResponse = { data: 'test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('makes POST request with data', async () => {
    const postData = { username: 'test', email: 'test@example.com' };
    const mockResponse = { success: true };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.post('/test', postData);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
    expect(result).toEqual(mockResponse);
  });

  it('handles 401 authentication errors', async () => {
    const mockToken = 'expired-token';
    localStorage.getItem.mockReturnValue(mockToken);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(apiClient.get('/protected')).rejects.toThrow(
      'Authentication failed. Please log in again.'
    );

    expect(localStorage.removeItem).toHaveBeenCalledWith('auth-token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth-user');
  });

  it('handles general API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    await expect(apiClient.get('/error')).rejects.toThrow('Internal server error');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiClient.get('/network-error')).rejects.toThrow('Network error');
  });

  it('makes PUT request', async () => {
    const putData = { id: 1, name: 'updated' };
    const mockResponse = { success: true };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.put('/test/1', putData);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putData),
    });
    expect(result).toEqual(mockResponse);
  });

  it('makes DELETE request', async () => {
    const mockResponse = { success: true };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.delete('/test/1');

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/test/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('handles file upload', async () => {
    const mockToken = 'test-token';
    localStorage.getItem.mockReturnValue(mockToken);

    const formData = new FormData();
    formData.append('file', new Blob(['test']), 'test.txt');

    const mockResponse = { url: '/uploads/test.txt' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiClient.uploadFile('/upload', formData);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
      body: formData,
    });
    expect(result).toEqual(mockResponse);
  });
});