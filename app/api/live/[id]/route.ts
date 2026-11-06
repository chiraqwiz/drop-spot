import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';
import { isIvsConfigured, getIvsViewerCount } from '@/lib/ivs';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({
    where: { id: params.id },
    include: { broadcaster: { select: userPublicSelect } },
  });
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });

  let viewerCount: number | null = null;
  if (stream.status === 'LIVE' && isIvsConfigured()) {
    viewerCount = await getIvsViewerCount(stream.channelArn);
  }

  return NextResponse.json({
    stream: {
      id: stream.id,
      title: stream.title,
      status: stream.status,
      playbackUrl: stream.playbackUrl,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      broadcaster: stream.broadcaster,
      isMine: stream.broadcasterId === user.id,
      viewerCount,
    },
  });
}
