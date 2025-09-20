import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';

export default async function Page({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const _params = await params;

  return (
    <PageClientImpl
      roomId={_params.roomId}
    />
  );
}