import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const createSchema = z.object({
  caption: z.string().trim().min(1).max(2000),
  mediaUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
  mediaType: z.enum(['image', 'video']).optional(),
});

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 20) || 20, 50);
  const cursor = searchParams.get('cursor') ?? undefined;

  // Your feed: posts from people you follow plus your own. Until you follow
  // anyone, the feed shows everything so a brand-new community never looks dead.
  const followed = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const authorFilter =
    followed.length > 0
      ? { userId: { in: [user.id, ...followed.map((f) => f.followingId)] } }
      : {};

  const posts = await prisma.post.findMany({
    where: authorFilter,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: userPublicSelect },
      likes: { where: { userId: user.id }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      mediaType: p.mediaType ?? (p.mediaUrl ? 'image' : null),
      createdAt: p.createdAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      likedByMe: p.likes.length > 0,
      user: p.user,
    })),
    nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Post text is required (up to 2000 characters)' }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      caption: parsed.data.caption,
      mediaUrl: parsed.data.mediaUrl || null,
      mediaType: parsed.data.mediaUrl ? parsed.data.mediaType ?? 'image' : null,
    },
    include: { user: { select: userPublicSelect } },
  });

  // Notify the author's friends about the new post (photos, videos, or text).
  const followers = await prisma.follow.findMany({
    where: { followingId: user.id },
    select: { followerId: true },
  });
  const seen = new Set<string>();
  const friendIds: string[] = [];
  for (const f of followers) {
    if (f.followerId !== user.id && !seen.has(f.followerId)) {
      seen.add(f.followerId);
      friendIds.push(f.followerId);
    }
  }
  if (friendIds.length > 0) {
    const label = !post.mediaUrl ? 'a new post' : post.mediaType === 'video' ? 'a new video' : 'a new photo';
    await prisma.notification.createMany({
      data: friendIds.map((id) => ({
        userId: id,
        type: 'post',
        message: `${user.name} shared ${label}.`,
      })),
    });
  }

  return NextResponse.json(
    {
      post: {
        id: post.id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        createdAt: post.createdAt,
        likesCount: 0,
        commentsCount: 0,
        likedByMe: false,
        user: post.user,
      },
    },
    { status: 201 },
  );
}
