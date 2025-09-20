'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChannelCreator } from './ChannelCreator';

interface Channel {
  id: number;
  name: string;
  roomId: number;
  isMainLobby: boolean;
  livekitRoomName: string;
  createdAt: string;
}

interface ChannelManagerProps {
  roomId: number;
  channels: Channel[];
  onChannelCreated: (channel: Channel) => void;
  onChannelDeleted: (channelId: number) => void;
}

export function ChannelManager({
  roomId,
  channels,
  onChannelCreated,
  onChannelDeleted
}: ChannelManagerProps) {
  const [deletingChannelId, setDeletingChannelId] = useState<number | null>(null);

  const handleDeleteChannel = async (channel: Channel) => {
    if (channel.isMainLobby) {
      toast.error('Cannot delete main lobby channel');
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete the channel "${channel.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingChannelId(channel.id);

    try {
      const authToken = localStorage.getItem('auth-token');
      const response = await fetch(`http://localhost:8080/api/channels/${channel.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete channel');
      }

      onChannelDeleted(channel.id);
      toast.success(`Channel "${channel.name}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete channel:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete channel');
    } finally {
      setDeletingChannelId(null);
    }
  };

  const teamChannels = channels.filter(ch => !ch.isMainLobby);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <ChannelCreator
        roomId={roomId}
        onChannelCreated={onChannelCreated}
      />

      {teamChannels.length > 0 && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#36393f',
          borderRadius: '8px',
          border: '1px solid #40444b'
        }}>
          <div style={{
            fontSize: '0.8rem',
            marginBottom: '0.5rem',
            opacity: 0.7,
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            Manage Team Channels
          </div>

          {teamChannels.map((channel) => (
            <div
              key={channel.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                backgroundColor: '#40444b',
                borderRadius: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.9rem'
              }}>
                <span style={{ marginRight: '0.5rem' }}>#</span>
                {channel.name}
              </div>

              <button
                onClick={() => handleDeleteChannel(channel)}
                disabled={deletingChannelId === channel.id}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#ed4245',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: deletingChannelId === channel.id ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                  opacity: deletingChannelId === channel.id ? 0.6 : 1
                }}
              >
                {deletingChannelId === channel.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}