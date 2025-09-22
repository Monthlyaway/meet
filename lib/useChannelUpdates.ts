'use client';

import { useState, useEffect } from 'react';
import { Channel } from './types';

export function useChannelUpdates(roomId: string, initialChannels: Channel[]) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [error, setError] = useState<string | null>(null);

  console.log('📡 useChannelUpdates: Hook initialized', {
    roomId,
    initialChannelCount: initialChannels.length
  });

  const fetchChannels = async (): Promise<Channel[]> => {
    try {
      console.log('📡 useChannelUpdates: Fetching channels', { roomId });
      const response = await fetch(`/api/rooms/${roomId}/channels`);

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 useChannelUpdates: Channels fetched', {
        roomId,
        channelCount: data.channels.length
      });

      return data.channels || [];
    } catch (error) {
      console.error('📡 useChannelUpdates: Error fetching channels', error);
      throw error;
    }
  };

  // Update channels when initialChannels change
  useEffect(() => {
    setChannels(initialChannels);
  }, [initialChannels]);

  return {
    channels,
    isConnected: true, // Always connected for memory storage
    error,
    refetch: async () => {
      try {
        const updatedChannels = await fetchChannels();
        setChannels(updatedChannels);
        return updatedChannels;
      } catch (error) {
        console.error('📡 useChannelUpdates: Manual refetch failed', error);
        setError('Failed to fetch channels');
        throw error;
      }
    }
  };
}