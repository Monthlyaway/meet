import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useAuth } from '@/lib/auth/useAuth';
import JoinRoomPage from './page';
import '@testing-library/jest-dom';

// Mock modules
vi.mock('@/lib/auth/useAuth');
vi.mock('@/lib/api/apiClient');

const mockUseAuth = vi.mocked(useAuth);

// Mock CSS modules
vi.mock('@/styles/Auth.module.css', () => ({
  default: {
    authContainer: 'auth-container',
    authCard: 'auth-card',
    authHeader: 'auth-header',
    authTitle: 'auth-title',
    authSubtitle: 'auth-subtitle',
    authForm: 'auth-form',
    formGroup: 'form-group',
    formLabel: 'form-label',
    formInput: 'form-input',
    formInputError: 'form-input-error',
    formError: 'form-error',
    authButton: 'auth-button',
    authButtonPrimary: 'auth-button-primary',
    authFooter: 'auth-footer',
    authLink: 'auth-link',
    authLinkText: 'auth-link-text'
  }
}));

describe('JoinRoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders join room form when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<JoinRoomPage />);

    expect(screen.getByRole('heading', { name: 'Join Room' })).toBeInTheDocument();
    expect(screen.getByText('Enter your access token to join a gaming room')).toBeInTheDocument();
    expect(screen.getByLabelText('Room Access Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeInTheDocument();
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<JoinRoomPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard link in footer', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' },
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<JoinRoomPage />);

    expect(screen.getByText('Need to create a room?')).toBeInTheDocument();
    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });
});