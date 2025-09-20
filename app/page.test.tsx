import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import HomePage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth hook
vi.mock('@/lib/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockPush = vi.fn();
const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);

describe('HomePage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it('redirects to dashboard when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' },
      token: 'mock-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<HomePage />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<HomePage />);

    expect(mockPush).toHaveBeenCalledWith('/login');
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

    render(<HomePage />);

    expect(screen.getByText('Gaming Voice Chat')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect while loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<HomePage />);

    expect(mockPush).not.toHaveBeenCalled();
  });
});