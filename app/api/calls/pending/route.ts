import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const RING_WINDOW_MS = 2 * 60 * 1000; // an unanswered call stops ringing after 2 minutes

// Pending incoming call invites for me. ?peer=<username> narrows to one caller.
export async function GET(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const peer = searchParams.get('peer');
  const cutoff = new Date(Date.now() - RING_WINDOW_MS);

  // Anything older than the ring window counts as missed.
  await prisma.callInvite.updateMany({
    where: { receiverId: me.id, status: 'PENDING', createdAt: { lt: cutoff } },
    data: { status: 'MISSED' },
  });

  const invites = await prisma.callInvite.findMany({
    where: {
      receiverId: me.id,
      status: 'PENDING',
      createdAt: { gte: cutoff },
      ...(peer ? { caller: { username: peer.toLowerCase() } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { caller: { select: userPublicSelect } },
  });

  return NextResponse.json({
    invites: invites.map((i) => ({
      id: i.id,
      roomId: i.roomId,
      createdAt: i.createdAt,
      caller: i.caller,
    })),
  });
}
