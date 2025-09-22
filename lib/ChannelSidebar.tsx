'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AdminIdentityManager } from './admin-identity';
import { Channel } from './types';
import { CreateChannelButton } from './CreateChannelButton';
import { ChannelButton } from './ChannelButton';
import { useChannelUpdates } from './useChannelUpdates';
import styles from '../styles/ChannelSidebar.module.css';

interface ChannelSidebarProps {
  roomId: string;
  currentChannelId: string;
  initialChannels: Channel[];
}

export function ChannelSidebar({ roomId, currentChannelId, initialChannels }: ChannelSidebarProps) {
  console.log('🎯 ChannelSidebar: Rendering sidebar', { roomId, currentChannelId, channelCount: initialChannels.length });

  const router = useRouter();
  const { channels, isConnected, error, refetch } = useChannelUpdates(roomId, initialChannels);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🎯 ChannelSidebar: Checking admin status');
    AdminIdentityManager.isRoomAdmin(roomId)
      .then(adminStatus => {
        setIsAdmin(adminStatus);
        setIsLoading(false);
        console.log('🎯 ChannelSidebar: Admin status determined', { isAdmin: adminStatus });
      })
      .catch(error => {
        console.error('🎯 ChannelSidebar: Error checking admin status', error);
        setIsAdmin(false);
        setIsLoading(false);
      });
  }, [roomId]);

  const navigateToChannel = (channelId: string) => {
    console.log('🎯 ChannelSidebar: Navigating to channel', { roomId, channelId });
    router.push(`/rooms/${roomId}/channels/${channelId}`);
  };

  const handleCreateChannel = async (displayName: string) => {
    console.log('🎯 ChannelSidebar: Creating new channel', { roomId, displayName });
    try {
      const userId = AdminIdentityManager.getUserId();
      const response = await fetch(`/api/rooms/${roomId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, creatorId: userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎯 ChannelSidebar: Channel created successfully', result);
        // Manually refresh channels since we don't have real-time updates
        await refetch();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('🎯 ChannelSidebar: Failed to create channel', {
          status: response.status,
          error: errorData.error
        });
        throw new Error(errorData.error || `Failed to create channel (${response.status})`);
      }
    } catch (error) {
      console.error('🎯 ChannelSidebar: Error creating channel', error);
      throw error; // Re-throw so CreateChannelButton can handle the error
    }
  };

  if (isLoading) {
    return (
      <div className={styles.channelSidebar} data-lk-theme="default">
        <div className={styles.header}>
          <h3>Team Channels</h3>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.channelSidebar} data-lk-theme="default">
      <div className={styles.header}>
        <h3>Team Channels</h3>
        {!isConnected && !error && (
          <div className={styles.connectionStatus}>Connecting...</div>
        )}
        {error && (
          <div className={styles.errorStatus}>{error}</div>
        )}
      </div>

      <div className={styles.channelList}>
        {channels.map(channel => (
          <ChannelButton
            key={channel.channelId}
            channel={channel}
            isActive={channel.channelId === currentChannelId}
            onClick={() => navigateToChannel(channel.channelId)}
          />
        ))}
      </div>

      {isAdmin && (
        <div className={styles.adminControls}>
          <CreateChannelButton onCreateChannel={handleCreateChannel} />
        </div>
      )}
    </div>
  );
}