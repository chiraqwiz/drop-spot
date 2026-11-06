import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const schema = z.object({ receiverId: z.string().min(1) });

// Start a 1:1 video call with a friend: creates the invite + notifies them.
export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { receiverId } = parsed.data;
  if (receiverId === me.id) {
    return NextResponse.json({ error: 'You cannot call yourself' }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Friends only: follows must exist in both directions.
  const [outgoing, incoming] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: receiverId } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: receiverId, followingId: me.id } },
    }),
  ]);
  if (!outgoing || !incoming) {
    return NextResponse.json({ error: 'You can only call friends' }, { status: 403 });
  }

  const roomId = `room_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const invite = await prisma.callInvite.create({
    data: { callerId: me.id, receiverId, roomId, status: 'PENDING' },
    include: { caller: { select: userPublicSelect } },
  });
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'call',
      message: `${me.name} started a video call.`,
      actionUrl: `/calls/${roomId}`,
    },
  });
  // Push it too, so it reaches them even with the app closed (best-effort).
  const { sendPushToUser } = await import('@/lib/push');
  await sendPushToUser(receiverId, {
    title: `${me.name} is calling you`,
    body: 'Tap to join the video call on DROP SPOT.',
    url: `/calls/${roomId}`,
    tag: `call-${roomId}`,
    vibrate: [400, 200, 400, 200, 400],
    requireInteraction: true,
  });

  return NextResponse.json({ invite: { id: invite.id, roomId: invite.roomId } }, { status: 201 });
}
