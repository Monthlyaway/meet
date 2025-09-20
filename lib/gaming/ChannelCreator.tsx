'use client';

import React, { useState, FormEvent } from 'react';
import { toast } from 'react-hot-toast';

interface Channel {
  id: number;
  name: string;
  roomId: number;
  isMainLobby: boolean;
  livekitRoomName: string;
  createdAt: string;
}

interface ChannelCreatorProps {
  roomId: number;
  onChannelCreated: (channel: Channel) => void;
}

export function ChannelCreator({ roomId, onChannelCreated }: ChannelCreatorProps) {
  const [channelName, setChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateChannel = async (e: FormEvent) => {
    e.preventDefault();

    if (!channelName.trim()) {
      toast.error('Channel name is required');
      return;
    }

    setIsCreating(true);

    try {
      const authToken = localStorage.getItem('auth-token');
      const response = await fetch(`http://localhost:8080/api/rooms/${roomId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: channelName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create channel');
      }

      const data = await response.json();
      onChannelCreated(data.channel);
      setChannelName('');
      toast.success(`Channel "${data.channel.name}" created successfully`);
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create channel');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreateChannel} style={{
      marginBottom: '1rem',
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
        Create Team Channel
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="Enter channel name"
          required
          minLength={1}
          maxLength={100}
          disabled={isCreating}
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: '#40444b',
            border: '1px solid #72767d',
            borderRadius: '4px',
            color: 'white',
            fontSize: '0.9rem'
          }}
        />
        <button
          type="submit"
          disabled={isCreating || !channelName.trim()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isCreating ? '#5865f2' : '#5865f2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            opacity: isCreating || !channelName.trim() ? 0.6 : 1
          }}
        >
          {isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
}