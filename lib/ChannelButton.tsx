'use client';

import { Channel } from './room-storage';
import styles from '../styles/ChannelSidebar.module.css';

interface ChannelButtonProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

export function ChannelButton({ channel, isActive, onClick }: ChannelButtonProps) {
  console.log('🔄 ChannelButton: Rendering button', {
    channelId: channel.channelId,
    displayName: channel.displayName,
    isActive
  });

  const getChannelIcon = (channelId: string) => {
    if (channelId === 'main-lobby') {
      return '🏠';
    }
    return '#';
  };

  const handleClick = () => {
    console.log('🔄 ChannelButton: Button clicked', {
      channelId: channel.channelId,
      displayName: channel.displayName
    });
    onClick();
  };

  return (
    <button
      className={`${styles.channelButton} ${isActive ? styles.active : ''}`}
      onClick={handleClick}
      type="button"
      aria-pressed={isActive}
    >
      <span className={styles.channelIcon}>
        {getChannelIcon(channel.channelId)}
      </span>
      <span className={styles.channelName}>
        {channel.displayName}
      </span>
    </button>
  );
}