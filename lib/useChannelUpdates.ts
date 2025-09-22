'use client';

import { useState, useEffect, useRef } from 'react';
import { Channel } from './types';

interface ChannelUpdateEvent {
  type: 'CONNECTED' | 'CHANNELS_UPDATED' | 'ROOM_UPDATED' | 'KEEPALIVE' | 'ERROR';
  timestamp: number;
  roomId?: string;
  message?: string;
}

export function useChannelUpdates(roomId: string, initialChannels: Channel[]) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

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

  const connectSSE = () => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('📡 useChannelUpdates: Connecting to SSE', { roomId, attempt: reconnectAttemptsRef.current + 1 });

    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 useChannelUpdates: SSE connection opened', { roomId });
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = async (event) => {
      try {
        const eventData: ChannelUpdateEvent = JSON.parse(event.data);
        console.log('📡 useChannelUpdates: SSE message received', {
          roomId,
          type: eventData.type,
          timestamp: eventData.timestamp
        });

        switch (eventData.type) {
          case 'CONNECTED':
            console.log('📡 useChannelUpdates: SSE connected', { roomId });
            break;

          case 'CHANNELS_UPDATED':
            console.log('📡 useChannelUpdates: Channels updated, refetching', { roomId });
            try {
              const updatedChannels = await fetchChannels();
              setChannels(updatedChannels);
              console.log('📡 useChannelUpdates: Channels updated in state', {
                roomId,
                newChannelCount: updatedChannels.length
              });
            } catch (error) {
              console.error('📡 useChannelUpdates: Error updating channels', error);
            }
            break;

          case 'ROOM_UPDATED':
            console.log('📡 useChannelUpdates: Room metadata updated', { roomId });
            // Could trigger metadata refresh if needed
            break;

          case 'KEEPALIVE':
            // Silent keepalive, no action needed
            break;

          case 'ERROR':
            console.error('📡 useChannelUpdates: SSE error event', {
              roomId,
              message: eventData.message
            });
            setError(eventData.message || 'Server-sent event error');
            break;

          default:
            console.log('📡 useChannelUpdates: Unknown SSE event type', {
              roomId,
              type: eventData.type
            });
        }
      } catch (error) {
        console.error('📡 useChannelUpdates: Error parsing SSE message', error);
      }
    };

    eventSource.onerror = (event) => {
      console.error('📡 useChannelUpdates: SSE connection error', { roomId, event });
      setIsConnected(false);

      // Implement exponential backoff for reconnection
      const maxAttempts = 5;
      const baseDelay = 1000; // 1 second

      if (reconnectAttemptsRef.current < maxAttempts) {
        const delay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;

        console.log('📡 useChannelUpdates: Scheduling reconnection', {
          roomId,
          attempt: reconnectAttemptsRef.current,
          delay
        });

        reconnectTimeoutRef.current = setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectSSE();
          }
        }, delay);
      } else {
        console.error('📡 useChannelUpdates: Max reconnection attempts reached', { roomId });
        setError('Connection lost. Please refresh the page.');
      }
    };
  };

  useEffect(() => {
    console.log('📡 useChannelUpdates: Effect triggered', { roomId });

    // Connect to SSE
    connectSSE();

    // Cleanup function
    return () => {
      console.log('📡 useChannelUpdates: Cleaning up SSE connection', { roomId });

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      setIsConnected(false);
    };
  }, [roomId]); // Only depend on roomId

  // Update channels when initialChannels change (for initial load)
  useEffect(() => {
    if (!isConnected) {
      setChannels(initialChannels);
    }
  }, [initialChannels, isConnected]);

  return {
    channels,
    isConnected,
    error,
    refetch: async () => {
      try {
        const updatedChannels = await fetchChannels();
        setChannels(updatedChannels);
        return updatedChannels;
      } catch (error) {
        console.error('📡 useChannelUpdates: Manual refetch failed', error);
        throw error;
      }
    }
  };
}