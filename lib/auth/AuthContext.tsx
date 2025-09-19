'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// TypeScript interfaces from Dev Notes
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

interface UserLogin {
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR' }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INIT'; payload: { user: User; token: string } | null };

interface AuthContextType extends AuthState {
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserRegistration) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth reducer for state management
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      };
    case 'AUTH_INIT':
      if (action.payload) {
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          token: action.payload.token,
          isLoading: false
        };
      }
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Session persistence: Check localStorage JWT on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const userStr = localStorage.getItem('auth-user');

        if (token && userStr) {
          const user = JSON.parse(userStr);

          // Validate token with backend
          const response = await fetch('http://localhost:8080/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            dispatch({ type: 'AUTH_INIT', payload: { user, token } });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
            dispatch({ type: 'AUTH_INIT', payload: null });
          }
        } else {
          dispatch({ type: 'AUTH_INIT', payload: null });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        dispatch({ type: 'AUTH_INIT', payload: null });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: UserLogin): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      const { user, token } = data;

      // Store JWT token and user in localStorage
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(user));

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      throw error;
    }
  };

  const register = async (userData: UserRegistration): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      const { user, token } = data;

      // Store JWT token and user in localStorage (auto-login after registration)
      localStorage.setItem('auth-token', token);
      localStorage.setItem('auth-user', JSON.stringify(user));

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
      throw error;
    }
  };

  const logout = (): void => {
    // Clear localStorage and auth state
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export hook for easy access to auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export types for use in other components
export type { User, UserLogin, UserRegistration, AuthState };