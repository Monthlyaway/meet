import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import LoginPage from './page';
import { AuthProvider } from '@/lib/auth/AuthContext';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    // Mock successful validation call for AuthProvider initialization
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });
  });

  it('renders login form correctly', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to join your gaming voice channels')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByText('Remember me')).toBeInTheDocument();
    });
  });

  it('validates form inputs', async () => {
    const { container } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    // Clear the global fetch mock for this test
    mockFetch.mockClear();

    const { container } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = await screen.findByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    // Make sure input changes are applied
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'validpassword123' } });

    // Verify the values were set
    expect(emailInput.value).toBe('invalid-email');
    expect(passwordInput.value).toBe('validpassword123');

    // Submit the form
    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Validation should prevent any API calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    // Clear the global fetch mock for this test
    mockFetch.mockClear();

    const { container } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = await screen.findByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    // Validation should prevent any API calls
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits valid form successfully', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    // Mock successful login response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: 'test-token' }),
    });

    const { container } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login failure', async () => {
    // Mock failed login response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    const { container } = render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    const form = container.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    });
  });

  it('clears errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = await screen.findByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    // Trigger validation error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('handles remember me checkbox', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const rememberMeCheckbox = await screen.findByLabelText('Remember me');

    expect(rememberMeCheckbox).not.toBeChecked();

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();

    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('shows loading state during submission', async () => {
    // Mock slow login response
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      .mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ user: {}, token: 'test' }),
        }), 100))
      );

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = await screen.findByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});