import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const actionSchema = z.object({ action: z.enum(['accept', 'decline']) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const request = await prisma.friendRequest.findUnique({ where: { id: params.id } });
  if (!request || request.receiverId !== user.id || request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (parsed.data.action === 'decline') {
    await prisma.friendRequest.update({
      where: { id: params.id },
      data: { status: 'DECLINED' },
    });
    return NextResponse.json({ ok: true, status: 'DECLINED' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.friendRequest.update({ where: { id: params.id }, data: { status: 'ACCEPTED' } });
    await tx.follow.createMany({
      data: [
        { followerId: request.senderId, followingId: request.receiverId },
        { followerId: request.receiverId, followingId: request.senderId },
      ],
      skipDuplicates: true,
    });
    await tx.notification.create({
      data: {
        userId: request.senderId,
        type: 'friend_accept',
        message: `${user.name} accepted your friend request.`,
      },
    });
  });
  return NextResponse.json({ ok: true, status: 'ACCEPTED' });
}
