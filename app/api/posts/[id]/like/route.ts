import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: user.id, postId: params.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: params.id }, data: { likesCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ liked: false });
  }

  await prisma.$transaction([
    prisma.like.create({ data: { userId: user.id, postId: params.id } }),
    prisma.post.update({ where: { id: params.id }, data: { likesCount: { increment: 1 } } }),
    ...(post.userId !== user.id
      ? [
          prisma.notification.create({
            data: {
              userId: post.userId,
              type: 'like',
              message: `${user.name} liked your post.`,
            },
          }),
        ]
      : []),
  ]);
  return NextResponse.json({ liked: true });
}
