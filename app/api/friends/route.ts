import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

// Your friends: people you follow who also follow you back (what accepting a
// friend request creates), ordered by name.
export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const [following, followers] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: me.id }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: me.id }, select: { followerId: true } }),
  ]);
  const followerIds = new Set(followers.map((f) => f.followerId));
  const friendIds = following.map((f) => f.followingId).filter((id) => followerIds.has(id));

  const friends = await prisma.user.findMany({
    where: { id: { in: friendIds } },
    select: userPublicSelect,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ friends });
}
