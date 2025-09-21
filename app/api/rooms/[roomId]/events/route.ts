import { NextRequest } from 'next/server';
import { promises as fs, watch } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  console.log('📡 SSE Events API: Connection initiated', { roomId });

  const encoder = new TextEncoder();
  const ROOMS_DIR = path.join(process.cwd(), 'docs', 'rooms');
  const roomPath = path.join(ROOMS_DIR, roomId);

  let watcher: any = null;

  const stream = new ReadableStream({
    start(controller) {
      console.log('📡 SSE Events API: Stream started', { roomId });

      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({
        type: 'CONNECTED',
        timestamp: Date.now(),
        roomId
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // Check if room directory exists
      fs.access(roomPath).then(() => {
        // Watch for file changes in the room directory
        try {
          watcher = watch(roomPath, { persistent: false }, (eventType: string, filename: string | null) => {
            console.log('📡 SSE Events API: File change detected', {
              roomId,
              eventType,
              filename
            });

            if (filename === 'channels.json') {
              const data = `data: ${JSON.stringify({
                type: 'CHANNELS_UPDATED',
                timestamp: Date.now(),
                roomId
              })}\n\n`;

              try {
                controller.enqueue(encoder.encode(data));
                console.log('📡 SSE Events API: CHANNELS_UPDATED event sent', { roomId });
              } catch (error) {
                console.error('📡 SSE Events API: Error sending CHANNELS_UPDATED', error);
                // Stream might be closed, ignore error
              }
            }

            if (filename === 'metadata.json') {
              const data = `data: ${JSON.stringify({
                type: 'ROOM_UPDATED',
                timestamp: Date.now(),
                roomId
              })}\n\n`;

              try {
                controller.enqueue(encoder.encode(data));
                console.log('📡 SSE Events API: ROOM_UPDATED event sent', { roomId });
              } catch (error) {
                console.error('📡 SSE Events API: Error sending ROOM_UPDATED', error);
                // Stream might be closed, ignore error
              }
            }
          });

          console.log('📡 SSE Events API: File watcher established', { roomId });

        } catch (error) {
          console.error('📡 SSE Events API: Error setting up file watcher', error);
          const errorMsg = `data: ${JSON.stringify({
            type: 'ERROR',
            message: 'Failed to establish file watcher',
            timestamp: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMsg));
        }
      }).catch((error) => {
        console.error('📡 SSE Events API: Room directory not found', { roomId, error });
        const errorMsg = `data: ${JSON.stringify({
          type: 'ERROR',
          message: 'Room not found',
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMsg));
      });

      // Send keepalive messages every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          const keepAliveMsg = `data: ${JSON.stringify({
            type: 'KEEPALIVE',
            timestamp: Date.now()
          })}\n\n`;
          controller.enqueue(encoder.encode(keepAliveMsg));
        } catch (error) {
          // Stream closed, clear interval
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        console.log('📡 SSE Events API: Client disconnected', { roomId });

        if (watcher) {
          try {
            watcher.close();
            console.log('📡 SSE Events API: File watcher closed', { roomId });
          } catch (error) {
            console.error('📡 SSE Events API: Error closing watcher', error);
          }
        }

        clearInterval(keepAliveInterval);

        try {
          controller.close();
        } catch (error) {
          // Stream might already be closed
        }
      });
    },

    cancel() {
      console.log('📡 SSE Events API: Stream cancelled', { roomId });

      if (watcher) {
        try {
          watcher.close();
        } catch (error) {
          console.error('📡 SSE Events API: Error closing watcher in cancel', error);
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}