import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isIvsConfigured, stopIvsChannel } from '@/lib/ivs';

// Broadcaster ends the stream: stop + delete the IVS channel, mark ENDED.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
  if (!stream || stream.broadcasterId !== user.id) {
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  }
  if (stream.status === 'ENDED') return NextResponse.json({ ok: true });

  if (isIvsConfigured()) {
    await stopIvsChannel(stream.channelArn);
  }
  await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'ENDED', endedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
