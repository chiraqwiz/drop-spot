import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Broadcaster taps "Start broadcast" in the studio: flip CREATED -> LIVE.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
  if (!stream || stream.broadcasterId !== user.id) {
    return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  }
  if (stream.status !== 'CREATED') {
    return NextResponse.json({ error: 'Stream is not waiting to go live.' }, { status: 409 });
  }

  await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'LIVE', startedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
