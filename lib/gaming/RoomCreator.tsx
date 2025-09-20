'use client';

import React, { useState } from 'react';
import { roomApi, type RoomCreation } from '@/lib/api/roomApi';

interface RoomCreatorProps {
  onRoomCreated?: (room: any, accessToken: string) => void;
  onError?: (error: string) => void;
}

export default function RoomCreator({ onRoomCreated, onError }: RoomCreatorProps) {
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ room: any; accessToken: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = roomName.trim();

    if (!trimmedName) {
      onError?.('Room name is required');
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      onError?.('Room name must be between 3 and 100 characters');
      return;
    }

    // Basic input sanitization - prevent potentially harmful characters
    if (!/^[a-zA-Z0-9\s\-_.,!@#$%&*()+=]+$/.test(trimmedName)) {
      onError?.('Room name contains invalid characters. Use only letters, numbers, spaces, and common punctuation.');
      return;
    }

    setIsCreating(true);

    try {
      const roomData: RoomCreation = {
        name: trimmedName
      };

      const response = await roomApi.createRoom(roomData);

      setCreatedRoom({
        room: response.room,
        accessToken: response.accessToken
      });

      onRoomCreated?.(response.room, response.accessToken);
      setRoomName('');
      setShowForm(false);

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create room';
      onError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyToken = () => {
    if (createdRoom?.accessToken) {
      navigator.clipboard.writeText(createdRoom.accessToken);
      // You could add a toast notification here
    }
  };

  const handleCreateAnother = () => {
    setCreatedRoom(null);
    setShowForm(true);
  };

  if (createdRoom) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-green-400">Room Created Successfully! 🎉</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Room Name</label>
            <p className="text-white font-semibold">{createdRoom.room.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Access Token</label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-900 px-3 py-2 rounded text-sm text-green-400 flex-1 font-mono break-all">
                {createdRoom.accessToken}
              </code>
              <button
                onClick={handleCopyToken}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Share this token with your team to let them join your room
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={handleCreateAnother}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Another Room
            </button>
            <button
              onClick={() => setCreatedRoom(null)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">Create Gaming Room</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-1">
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name (e.g., Squad Gaming Session)"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isCreating}
              maxLength={100}
              required
            />
            <p className="text-gray-400 text-xs mt-1">
              {roomName.length}/100 characters
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isCreating || !roomName.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isCreating}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-purple-400">Create Gaming Room</h2>
      <p className="text-gray-300 mb-4">
        Start a new voice chat room for your gaming session.
      </p>
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Create Room
      </button>
    </div>
  );
}