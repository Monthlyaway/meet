'use client';

import { Channel } from './room-storage';
import { ChannelSidebar } from './ChannelSidebar';
import styles from '../styles/ChannelWrapper.module.css';

interface ChannelWrapperProps {
  roomId: string;
  channel: Channel;
  initialChannels: Channel[];
  children: React.ReactNode;
}

export function ChannelWrapper({ roomId, channel, initialChannels, children }: ChannelWrapperProps) {
  console.log('🏠 ChannelWrapper: Rendering wrapper', {
    roomId,
    currentChannelId: channel.channelId,
    channelCount: initialChannels.length
  });

  return (
    <div className={styles.channelLayout} data-lk-theme="default">
      <div className={styles.sidebar}>
        <ChannelSidebar
          roomId={roomId}
          currentChannelId={channel.channelId}
          initialChannels={initialChannels}
        />
      </div>

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}