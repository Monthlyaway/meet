import type { User, UserLogin, UserRegistration } from './AuthContext';

const API_BASE_URL = 'http://localhost:8080';

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  }

  async register(userData: UserRegistration): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth-token');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Even if logout fails on backend, we still clear local storage
        console.error('Logout request failed:', error);
      }
    }

    // Clear local storage regardless of backend response
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
  }

  async validateToken(): Promise<User | null> {
    const token = localStorage.getItem('auth-token');

    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Token is invalid
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      return null;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('auth-user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('auth-user');
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;