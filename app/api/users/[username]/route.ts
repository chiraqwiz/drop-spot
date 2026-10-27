import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { username: params.username.toLowerCase() },
    select: {
      ...userPublicSelect,
      _count: { select: { followsReceived: true, followsGiven: true, posts: true } },
    },
  });
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isSelf = profile.id === me.id;
  const [isFriend, outgoing, incoming] = isSelf
    ? [false, null, null]
    : await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: me.id, followingId: profile.id } },
        }),
        prisma.friendRequest.findUnique({
          where: { senderId_receiverId: { senderId: me.id, receiverId: profile.id } },
        }),
        prisma.friendRequest.findUnique({
          where: { senderId_receiverId: { senderId: profile.id, receiverId: me.id } },
        }),
      ]);

  const posts = await prisma.post.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: { select: userPublicSelect },
      likes: { where: { userId: me.id }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      isVerified: profile.isVerified,
      createdAt: profile.createdAt,
      counts: {
        followers: profile._count.followsReceived,
        following: profile._count.followsGiven,
        posts: profile._count.posts,
      },
      relationship: isSelf
        ? 'self'
        : isFriend
          ? 'friends'
          : outgoing?.status === 'PENDING'
            ? 'outgoing'
            : incoming?.status === 'PENDING'
              ? 'incoming'
              : 'none',
      incomingRequestId: incoming?.status === 'PENDING' ? incoming.id : null,
    },
    posts: posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      createdAt: p.createdAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      likedByMe: p.likes.length > 0,
      user: p.user,
    })),
  });
}
