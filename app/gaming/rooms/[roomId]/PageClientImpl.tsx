'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';

// Types for gaming room data
interface Channel {
  id: number;
  name: string;
  roomId: number;
  isMainLobby: boolean;
  livekitRoomName: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface GamingRoom {
  id: number;
  name: string;
  accessToken: string;
  creatorId: number;
  isActive: boolean;
  createdAt: string;
  creator?: User;
  channels?: Channel[];
  members?: User[];
}

interface RoomJoinResponse {
  room: GamingRoom;
  mainLobbyChannel: Channel;
  livekitToken: string;
}

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function PageClientImpl(props: {
  roomId: string;
}) {
  const router = useRouter();
  const [roomData, setRoomData] = useState<RoomJoinResponse | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);

  // Load room data when component mounts
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token from localStorage
        const authToken = localStorage.getItem('auth-token');
        if (!authToken) {
          router.push('/auth/login');
          return;
        }

        // Fetch room data from backend
        const response = await fetch(`${API_BASE_URL}/api/rooms/${props.roomId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login');
            return;
          }
          throw new Error(`Failed to load room: ${response.status}`);
        }

        const data = await response.json();

        // Find the main lobby channel
        const mainLobby = data.room.channels?.find((ch: Channel) => ch.isMainLobby);
        if (!mainLobby) {
          throw new Error('Main lobby channel not found');
        }

        const roomResponse: RoomJoinResponse = {
          room: data.room,
          mainLobbyChannel: mainLobby,
          livekitToken: mainLobby.livekitRoomName,
        };

        setRoomData(roomResponse);
        setCurrentChannel(mainLobby);
      } catch (err) {
        console.error('Failed to load room:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
        toast.error('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [props.roomId, router]);

  const handlePreJoinSubmit = useCallback(async (values: LocalUserChoices) => {
    if (!roomData || !currentChannel) {
      toast.error('Room data not loaded');
      return;
    }

    try {
      setPreJoinChoices(values);

      // Get LiveKit connection token using existing endpoint
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', currentChannel.livekitRoomName);
      url.searchParams.append('participantName', values.username);

      const connectionDetailsResp = await fetch(url.toString());
      if (!connectionDetailsResp.ok) {
        throw new Error('Failed to get connection details');
      }

      const connectionDetailsData = await connectionDetailsResp.json();
      setConnectionToken(connectionDetailsData.token);
    } catch (err) {
      console.error('Failed to join room:', err);
      toast.error('Failed to join voice chat');
    }
  }, [roomData, currentChannel]);

  const handlePreJoinError = useCallback((e: any) => {
    console.error('PreJoin error:', e);
    toast.error('Failed to setup voice chat');
  }, []);

  const switchChannel = useCallback(async (channel: Channel) => {
    if (!preJoinChoices) {
      toast.error('Please join voice chat first');
      return;
    }

    try {
      // Switch channel on backend
      const authToken = localStorage.getItem('auth-token');
      const response = await fetch(`${API_BASE_URL}/api/channels/${channel.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to switch channel');
      }

      // Get new LiveKit connection token
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', channel.livekitRoomName);
      url.searchParams.append('participantName', preJoinChoices.username);

      const connectionDetailsResp = await fetch(url.toString());
      if (!connectionDetailsResp.ok) {
        throw new Error('Failed to get connection details');
      }

      const connectionDetailsData = await connectionDetailsResp.json();

      setCurrentChannel(channel);
      setConnectionToken(connectionDetailsData.token);
      toast.success(`Switched to ${channel.name}`);
    } catch (err) {
      console.error('Failed to switch channel:', err);
      toast.error('Failed to switch channel');
    }
  }, [preJoinChoices]);

  if (loading) {
    return (
      <main data-lk-theme="default" style={{ height: '100%' }}>
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div>Loading room...</div>
        </div>
      </main>
    );
  }

  if (error || !roomData) {
    return (
      <main data-lk-theme="default" style={{ height: '100%' }}>
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div>
            <h3>Error</h3>
            <p>{error || 'Failed to load room'}</p>
            <button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main data-lk-theme="default" style={{ height: '100%' }}>
      {connectionToken === null || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <div>
            <h2>Join {roomData.room.name}</h2>
            <p>Main Lobby - Voice Chat</p>
            <PreJoin
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
              onError={handlePreJoinError}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Channel Sidebar */}
          <div style={{
            width: '250px',
            backgroundColor: '#2f3136',
            color: 'white',
            padding: '1rem',
            borderRight: '1px solid #40444b'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              {roomData.room.name}
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                VOICE CHANNELS
              </h4>

              {roomData.room.channels?.map((channel) => (
                <div
                  key={channel.id}
                  onClick={() => switchChannel(channel)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: currentChannel?.id === channel.id ? '#5865f2' : 'transparent',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ marginRight: '0.5rem' }}>
                    {channel.isMainLobby ? '🔊' : '#'}
                  </span>
                  {channel.name}
                  {channel.isMainLobby && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>
                      MAIN
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              <p>Connected to: {currentChannel?.name}</p>
              <p>Room ID: {props.roomId}</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1 }}>
            <LiveKitRoomComponent
              connectionToken={connectionToken}
              userChoices={preJoinChoices}
              roomName={currentChannel?.livekitRoomName || ''}
              channelName={currentChannel?.name || ''}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function LiveKitRoomComponent(props: {
  userChoices: LocalUserChoices;
  connectionToken: string;
  roomName: string;
  channelName: string;
}) {
  const [room] = React.useState(
    () =>
      new Room({
        publishDefaults: {
          videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
          red: !props.roomName.startsWith('playground'),
          videoCodec: 'vp9' as VideoCodec,
        },
        adaptiveStream: { pixelDensity: 'screen' },
        dynacast: true,
      }),
  );

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    if (props.connectionToken && room && room.state === 'disconnected') {
      const connect = async () => {
        try {
          // Use the LiveKit server from environment
          const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
          await room.connect(wsUrl, props.connectionToken);
        } catch (error) {
          console.error('Failed to connect to LiveKit room:', error);
        }
      };
      connect();
    }

    return () => {
      if (room && room.state !== 'disconnected') {
        room.disconnect();
      }
    };
  }, [room, props.connectionToken]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Channel Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
          # {props.channelName}
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: '0.9rem', opacity: 0.7 }}>
          Voice Chat Active
        </span>
      </div>

      {/* LiveKit Video Conference */}
      <div style={{ flex: 1 }}>
        <RoomContext.Provider value={room}>
          <VideoConference
            chatMessageFormatter={formatChatMessageLinks}
            SettingsComponent={() => <div />} // Simplified settings for now
          />
        </RoomContext.Provider>
      </div>
    </div>
  );
}