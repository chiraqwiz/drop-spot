import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const suggest = searchParams.get('suggest') === '1';

  if (suggest) {
    // People you don't follow yet and haven't already requested.
    const [followed, requested] = await Promise.all([
      prisma.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
      prisma.friendRequest.findMany({
        where: { senderId: user.id, status: 'PENDING' },
        select: { receiverId: true },
      }),
    ]);
    const excluded = new Set([
      user.id,
      ...followed.map((f) => f.followingId),
      ...requested.map((r) => r.receiverId),
    ]);
    const users = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excluded) } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: userPublicSelect,
    });
    return NextResponse.json({ users });
  }

  if (!q) return NextResponse.json({ users: [] });
  const users = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
    select: userPublicSelect,
  });
  return NextResponse.json({ users });
}
