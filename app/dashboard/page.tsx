'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import ProtectedRoute from '@/lib/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import RoomCreator from '@/lib/gaming/RoomCreator';
import RoomList from '@/lib/gaming/RoomList';
import styles from '@/styles/Dashboard.module.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRoomCreated = (room: any, accessToken: string) => {
    setSuccessMessage(`Room "${room.name}" created successfully!`);
    setErrorMessage(null);
    setRefreshTrigger(prev => prev + 1); // Trigger room list refresh
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage(null);
    // Clear error message after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <ProtectedRoute>
      <div className={styles.dashboardContainer}>
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>Gaming Voice Chat</h1>
              <div className={styles.headerActions}>
                <span className={styles.welcomeText}>Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          {/* Status Messages */}
          {(errorMessage || successMessage) && (
            <div className={styles.statusMessages}>
              {errorMessage && (
                <div className={styles.errorMessage}>
                  <p className={styles.statusText}>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className={styles.successMessage}>
                  <p className={styles.statusText}>{successMessage}</p>
                </div>
              )}
            </div>
          )}

          <div className={styles.mainGrid}>
            {/* Room Creation Section */}
            <div>
              <RoomCreator
                onRoomCreated={handleRoomCreated}
                onError={handleError}
              />
            </div>

            {/* Join Room Section */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Join Room</h2>
              <p className={styles.cardDescription}>
                Use an access token to join an existing gaming room.
              </p>
              <button
                onClick={() => router.push('/join-room')}
                className={styles.joinRoomButton}
              >
                Join Room
              </button>
              <p className={styles.joinRoomHint}>
                Enter your room access token to join
              </p>
            </div>
          </div>

          {/* Room List Section */}
          <div className={styles.roomListSection}>
            <RoomList
              refreshTrigger={refreshTrigger}
              onError={handleError}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}