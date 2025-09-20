'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import ProtectedRoute from '@/lib/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import RoomCreator from '@/lib/gaming/RoomCreator';
import RoomList from '@/lib/gaming/RoomList';

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
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-purple-400">Gaming Voice Chat</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Messages */}
          {errorMessage && (
            <div className="mb-6 bg-red-600 border border-red-500 rounded-lg p-4">
              <p className="text-white">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-600 border border-green-500 rounded-lg p-4">
              <p className="text-white">{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Room Creation Section */}
            <div>
              <RoomCreator
                onRoomCreated={handleRoomCreated}
                onError={handleError}
              />
            </div>

            {/* Join Room Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Join Room</h2>
              <p className="text-gray-300 mb-4">
                Use an access token to join an existing gaming room.
              </p>
              <button
                onClick={() => router.push('/join-room')}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Join Room
              </button>
              <p className="text-gray-500 text-sm mt-2">
                Enter your room access token to join
              </p>
            </div>
          </div>

          {/* Room List Section */}
          <div className="mt-8">
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