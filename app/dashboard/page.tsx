'use client';

import { useAuth } from '@/lib/auth/useAuth';
import ProtectedRoute from '@/lib/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Create Gaming Room</h2>
              <p className="text-gray-300 mb-4">
                Start a new voice chat room for your gaming session.
              </p>
              <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Create Room
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Join Room</h2>
              <p className="text-gray-300 mb-4">
                Use an access token to join an existing gaming room.
              </p>
              <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Join Room
              </button>
            </div>
          </div>

          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">My Active Rooms</h2>
            <p className="text-gray-400">
              You haven&apos;t created or joined any rooms yet. Create your first room to get started!
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}