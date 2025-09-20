'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { apiClient } from '@/lib/api/apiClient';
import styles from '@/styles/Auth.module.css';

interface JoinRoomForm {
  accessToken: string;
}

interface JoinRoomResponse {
  message: string;
  room: {
    id: number;
    name: string;
    creator_id: number;
    channels: Array<{
      id: number;
      name: string;
      is_main_lobby: boolean;
      livekit_room_name: string;
    }>;
  };
  livekitRoomName: string;
}

export default function JoinRoomPage() {
  const [formData, setFormData] = useState<JoinRoomForm>({
    accessToken: ''
  });
  const [errors, setErrors] = useState<Partial<JoinRoomForm>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<JoinRoomForm> = {};

    if (!formData.accessToken) {
      newErrors.accessToken = 'Access token is required';
    } else if (formData.accessToken.length < 10) {
      newErrors.accessToken = 'Please enter a valid access token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      // Join room via our backend API
      const joinResponse: JoinRoomResponse = await apiClient.joinRoom(formData.accessToken);

      // Get the main lobby channel name for LiveKit
      const mainLobbyChannel = joinResponse.room.channels.find(
        channel => channel.is_main_lobby
      );

      if (!mainLobbyChannel) {
        throw new Error('Main lobby channel not found');
      }

      // Redirect to gaming room interface with room ID
      // The gaming room page will handle calling /api/connection-details to get the LiveKit token
      router.push(`/gaming/rooms/${joinResponse.room.id}?joined=true`);
    } catch (error) {
      console.error('Room join error:', error);

      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Invalid access token')) {
          setErrors({
            accessToken: 'Invalid access token. Please check and try again.'
          });
        } else if (error.message.includes('Authentication failed')) {
          router.push('/login');
        } else {
          setGeneralError(error.message || 'Failed to join room. Please try again.');
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof JoinRoomForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear general error when user modifies input
    if (generalError) {
      setGeneralError('');
    }
  };

  // Don't render if still checking authentication
  if (authLoading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Join Room</h1>
          <p className={styles.authSubtitle}>Enter your access token to join a gaming room</p>
        </div>

        {generalError && (
          <div className={styles.formError} role="alert" style={{ marginBottom: '1rem' }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className={styles.formGroup}>
            <label htmlFor="accessToken" className={styles.formLabel}>
              Room Access Token
            </label>
            <input
              type="text"
              id="accessToken"
              name="accessToken"
              value={formData.accessToken}
              onChange={handleChange}
              className={`${styles.formInput} ${errors.accessToken ? styles.formInputError : ''}`}
              placeholder="Enter room access token"
              disabled={isLoading}
              autoComplete="off"
              aria-describedby={errors.accessToken ? 'token-error' : undefined}
            />
            {errors.accessToken && (
              <span id="token-error" className={styles.formError} role="alert">
                {errors.accessToken}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.authButton} ${styles.authButtonPrimary}`}
          >
            {isLoading ? 'Joining Room...' : 'Join Room'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <p className={styles.authLink}>
            Need to create a room?{' '}
            <a href="/dashboard" className={styles.authLinkText}>
              Go to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}