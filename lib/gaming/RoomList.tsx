'use client';

import React, { useState, useEffect } from 'react';
import { roomApi, type Room } from '@/lib/api/roomApi';
import { useAuth } from '@/lib/auth/useAuth';

interface RoomListProps {
  refreshTrigger?: number; // Used to trigger refresh from parent
  onError?: (error: string) => void;
}

export default function RoomList({ refreshTrigger, onError }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const { user } = useAuth();

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const response = await roomApi.getUserRooms();
      setRooms(response.rooms);
    } catch (error: any) {
      onError?.(error.message || 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [refreshTrigger]);

  const handleDeleteRoom = async (roomId: number, roomName: string) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingRoomId(roomId);
      await roomApi.deleteRoom(roomId);

      // Remove the room from the local state
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
    } catch (error: any) {
      onError?.(error.message || 'Failed to delete room');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const handleCopyToken = (accessToken: string) => {
    navigator.clipboard.writeText(accessToken);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">My Gaming Rooms</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <span className="ml-3 text-gray-300">Loading rooms...</span>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">My Gaming Rooms</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">
            You haven&apos;t created or joined any rooms yet.
          </p>
          <p className="text-gray-500 text-sm">
            Create your first room to get started with voice chat!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-400">My Gaming Rooms</h2>
        <button
          onClick={loadRooms}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => {
          const isCreator = user?.id === room.creatorId;
          const isDeleting = deletingRoomId === room.id;

          return (
            <div
              key={room.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {room.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>
                      {isCreator ? 'Creator' : 'Member'}
                      {room.creator && ` • by ${room.creator.username}`}
                    </span>
                    <span>Created {formatDate(room.createdAt)}</span>
                  </div>
                </div>

                {isCreator && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>

              {isCreator && (
                <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-600">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Access Token (for sharing)
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-xs text-green-400 flex-1 font-mono break-all">
                      {room.accessToken}
                    </code>
                    <button
                      onClick={() => handleCopyToken(room.accessToken)}
                      className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {room.channels && room.channels.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Channels ({room.channels.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {room.channels.map((channel) => (
                      <span
                        key={channel.id}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          channel.isMainLobby
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {channel.name}
                        {channel.isMainLobby && ' (Main)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}