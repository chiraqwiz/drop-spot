import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';
import { isIvsConfigured, createIvsChannel } from '@/lib/ivs';

// List currently-live streams (public to signed-in users)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const streams = await prisma.liveStream.findMany({
    where: { status: 'LIVE' },
    orderBy: { startedAt: 'desc' },
    include: { broadcaster: { select: userPublicSelect } },
  });
  return NextResponse.json({
    streams: streams.map((s) => ({
      id: s.id,
      title: s.title,
      startedAt: s.startedAt,
      broadcaster: s.broadcaster,
    })),
    liveConfigured: isIvsConfigured(),
  });
}

// Create a channel + stream row (status CREATED). Broadcaster then opens the studio.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!isIvsConfigured()) {
    return NextResponse.json(
      { error: 'Live streaming is not set up yet. Please try again later.' },
      { status: 503 }
    );
  }

  const existing = await prisma.liveStream.findFirst({
    where: { broadcasterId: user.id, status: { in: ['CREATED', 'LIVE'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return NextResponse.json({ id: existing.id });

  let title = '';
  try {
    const body = await req.json();
    if (typeof body?.title === 'string') title = body.title.slice(0, 120);
  } catch {
    // no body is fine
  }

  let channel;
  try {
    channel = await createIvsChannel(`dropspot-${user.id}-${Date.now()}`);
  } catch (e) {
    console.error('IVS CreateChannel failed', e);
    return NextResponse.json({ error: 'Could not start a live stream right now.' }, { status: 502 });
  }

  const stream = await prisma.liveStream.create({
    data: {
      broadcasterId: user.id,
      title,
      channelArn: channel.channelArn,
      streamKeyArn: channel.streamKeyArn,
      playbackUrl: channel.playbackUrl,
      ingestEndpoint: channel.ingestEndpoint,
      status: 'CREATED',
    },
  });
  return NextResponse.json({ id: stream.id }, { status: 201 });
}
