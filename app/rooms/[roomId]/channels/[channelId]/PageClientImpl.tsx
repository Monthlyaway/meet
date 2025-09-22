'use client';

import React from 'react';
import {
  ControlBar,
  GridLayout,
  LayoutContextProvider,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  PreJoin,
} from '@livekit/components-react';
import {
  DeviceUnsupportedError,
  Room,
  RoomConnectOptions,
  RoomOptions,
  Track,
  VideoCodec,
  setLogLevel,
  LogLevel,
} from 'livekit-client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { encodePassphrase, decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { RecordingIndicator } from '@/lib/RecordingIndicator';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';

const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

interface PageClientImplProps {
  roomName: string;
  region?: string;
  hq?: boolean;
  codec: VideoCodec;
}

export const PageClientImpl: React.FC<PageClientImplProps> = ({ roomName, region, hq, codec }) => {
  const [preJoinChoices, setPreJoinChoices] = useState<LocalUserChoices | undefined>(undefined);
  const router = useRouter();

  const [room] = useState(
    () =>
      new Room({
        videoCaptureDefaults: {
          deviceId: preJoinChoices?.videoDeviceId ?? undefined,
          resolution: hq ? { width: 1920, height: 1080 } : { width: 1280, height: 720 },
        },
        publishDefaults: {
          videoCodec: codec,
        },
        audioCaptureDefaults: {
          deviceId: preJoinChoices?.audioDeviceId ?? undefined,
        },
        adaptiveStream: { pixelDensity: 'screen' },
      } as RoomOptions),
  );

  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    roomName: string;
    participantToken: string;
  } | null>(null);

  const [connectOptions, setConnectOptions] = useState<RoomConnectOptions>({});

  useEffect(() => {
    setLogLevel(LogLevel.info);
  }, []);

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', roomName);
    url.searchParams.append('participantName', values.username);
    if (region) {
      url.searchParams.append('region', region);
    }

    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, [roomName, region]);

  const handlePreJoinError = React.useCallback((e: any) => {
    console.error(e);
  }, []);

  const handleDisconnected = React.useCallback(() => {
    setConnectionDetails(null);
    setPreJoinChoices(undefined);
    router.push('/');
  }, [router]);

  const handleError = React.useCallback((e: any) => {
    console.error(e);
    if (e instanceof DeviceUnsupportedError) {
      alert(
        `${e.message}. Please use Chrome, Safari, or Firefox with a supported device to continue.`,
      );
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setConnectOptions({
        autoSubscribe: true,
      });
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <>
      {connectionDetails === null && (
        <PreJoin
          onSubmit={handlePreJoinSubmit}
          onError={handlePreJoinError}
          defaults={{
            username: '',
            videoEnabled: true,
            audioEnabled: true,
          }}
        />
      )}
      {connectionDetails !== null && (
        <LiveKitRoom
          room={room}
          token={connectionDetails.participantToken}
          serverUrl={connectionDetails.serverUrl}
          connectOptions={connectOptions}
          video={preJoinChoices?.videoEnabled}
          audio={preJoinChoices?.audioEnabled}
          onDisconnected={handleDisconnected}
          onError={handleError}
        >
          <LayoutContextProvider>
            <MyVideoConference />
            <RoomAudioRenderer />
            <DebugMode />
          </LayoutContextProvider>
        </LiveKitRoom>
      )}
    </>
  );
};

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export interface LocalUserChoices {
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
}