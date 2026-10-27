import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Remove a friendship: deletes both follow rows and the accepted request.
export async function DELETE(_req: Request, { params }: { params: { username: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const other = await prisma.user.findUnique({ where: { username: params.username.toLowerCase() } });
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await prisma.$transaction([
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: me.id, followingId: other.id },
          { followerId: other.id, followingId: me.id },
        ],
      },
    }),
    prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: me.id, receiverId: other.id },
          { senderId: other.id, receiverId: me.id },
        ],
        status: 'ACCEPTED',
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
