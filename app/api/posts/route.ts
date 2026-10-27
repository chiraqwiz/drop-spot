import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const createSchema = z.object({
  caption: z.string().trim().min(1).max(2000),
  mediaUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
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
    },
    include: { user: { select: userPublicSelect } },
  });

  return NextResponse.json(
    {
      post: {
        id: post.id,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
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
