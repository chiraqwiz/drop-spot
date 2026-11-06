import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isIvsConfigured, getIvsStreamKey } from '@/lib/ivs';

// Broadcaster-only: fetch ingest credentials for the studio page.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
  if (!stream || stream.broadcasterId !== user.id) {
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  }
  if (stream.status === 'ENDED') {
    return NextResponse.json({ error: 'This stream has ended.' }, { status: 410 });
  }
  if (!isIvsConfigured()) {
    return NextResponse.json({ error: 'Live streaming is not set up yet.' }, { status: 503 });
  }

  try {
    const streamKey = await getIvsStreamKey(stream.streamKeyArn);
    return NextResponse.json({
      ingestEndpoint: stream.ingestEndpoint,
      streamKey,
      playbackUrl: stream.playbackUrl,
    });
  } catch (e) {
    console.error('IVS GetStreamKey failed', e);
    return NextResponse.json({ error: 'Could not get stream credentials.' }, { status: 502 });
  }
}
