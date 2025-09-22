import { redirect } from 'next/navigation';
import { RoomMemoryStorage } from '@/lib/room-storage-memory';

export default async function RoomRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const { roomId } = await params;
  const _searchParams = await searchParams;

  console.log('🔄 Room Redirect: Redirecting to main-lobby', { roomId, searchParams: _searchParams });

  // Validate room exists
  const metadata = await RoomMemoryStorage.getRoomMetadata(roomId);
  if (!metadata) {
    console.error('🔄 Room Redirect: Room not found', { roomId });
    redirect('/'); // Redirect to home page if room doesn't exist
  }

  // Build redirect URL with query parameters
  const redirectUrl = new URL(`/rooms/${roomId}/channels/main-lobby`, 'http://localhost:3000');

  if (_searchParams.region) {
    redirectUrl.searchParams.set('region', _searchParams.region);
  }
  if (_searchParams.hq) {
    redirectUrl.searchParams.set('hq', _searchParams.hq);
  }
  if (_searchParams.codec) {
    redirectUrl.searchParams.set('codec', _searchParams.codec);
  }

  console.log('🔄 Room Redirect: Redirecting to', { redirectUrl: redirectUrl.pathname + redirectUrl.search });

  redirect(redirectUrl.pathname + redirectUrl.search);
}