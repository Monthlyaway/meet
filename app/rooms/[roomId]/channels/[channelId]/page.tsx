import * as React from 'react';
import { notFound, redirect } from 'next/navigation';
import { RoomFileStorage } from '@/lib/room-storage-server';
import { PageClientImpl } from './PageClientImpl';
import { ChannelWrapper } from '@/lib/ChannelWrapper';
import { isVideoCodec } from '@/lib/types';

export default async function ChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string; channelId: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const { roomId, channelId } = await params;
  const _searchParams = await searchParams;

  console.log('📺 Channel Page: Loading channel', { roomId, channelId, searchParams: _searchParams });

  const metadata = await RoomFileStorage.getRoomMetadata(roomId);
  if (!metadata) {
    console.error('📺 Channel Page: Room not found', { roomId });
    notFound();
  }

  console.log('📺 Channel Page: Room metadata loaded', { metadata });

  const channels = await RoomFileStorage.getChannels(roomId);
  console.log('📺 Channel Page: Channels loaded', { channels });

  const channel = channels.find(c => c.channelId === channelId);
  if (!channel) {
    console.log('📺 Channel Page: Channel not found, redirecting to main-lobby', { roomId, channelId, availableChannels: channels.map(c => c.channelId) });
    redirect(`/rooms/${roomId}/channels/main-lobby`);
  }

  console.log('📺 Channel Page: Channel found', { channel });

  const codec =
    typeof _searchParams.codec === 'string' && isVideoCodec(_searchParams.codec)
      ? _searchParams.codec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;

  console.log('📺 Channel Page: Configuration', {
    livekitRoomName: channel.livekitRoomName,
    region: _searchParams.region,
    hq,
    codec
  });

  return (
    <ChannelWrapper
      roomId={roomId}
      channel={channel}
      initialChannels={channels}
    >
      <PageClientImpl
        roomName={channel.livekitRoomName}
        region={_searchParams.region}
        hq={hq}
        codec={codec}
      />
    </ChannelWrapper>
  );
}