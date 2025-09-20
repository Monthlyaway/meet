class ApiClient {
  private baseURL = 'http://localhost:8080';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth-token');

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      // Handle authentication failures
      if (response.status === 401) {
        // Token is invalid or expired, clear local storage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        // Redirect to login will be handled by auth context
        throw new Error('Authentication failed. Please log in again.');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Upload file
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('auth-token');

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let the browser set it
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        throw new Error('Authentication failed. Please log in again.');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload Error: ${response.status}`);
    }

    return response.json();
  }

  // Get the base URL
  getBaseURL(): string {
    return this.baseURL;
  }

  // Set a custom base URL (useful for testing)
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // Room joining with access token
  async joinRoom(accessToken: string): Promise<{
    message: string;
    room: any;
    livekitRoomName: string;
  }> {
    return this.post('/api/rooms/join', { accessToken: accessToken });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;