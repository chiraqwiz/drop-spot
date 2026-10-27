import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const sendSchema = z.object({ receiverId: z.string().min(1) });

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const requests = await prisma.friendRequest.findMany({
    where: { receiverId: user.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: userPublicSelect } },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { receiverId } = parsed.data;
  if (receiverId === user.id) {
    return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const alreadyFriends = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: user.id, followingId: receiverId } },
  });
  if (alreadyFriends) return NextResponse.json({ error: 'You are already friends' }, { status: 409 });

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId },
        { senderId: receiverId, receiverId: user.id },
      ],
      status: 'PENDING',
    },
  });
  if (existing) return NextResponse.json({ error: 'A request is already pending' }, { status: 409 });

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.friendRequest.create({
      data: { senderId: user.id, receiverId },
      include: { sender: { select: userPublicSelect } },
    });
    await tx.notification.create({
      data: { userId: receiverId, type: 'friend_request', message: `${user.name} sent you a friend request.` },
    });
    return created;
  });

  return NextResponse.json({ request }, { status: 201 });
}
