import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const createSchema = z.object({ body: z.string().trim().min(1).max(1000) });

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: userPublicSelect } },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { userId: user.id, postId: params.id, body: parsed.data.body },
      include: { user: { select: userPublicSelect } },
    });
    await tx.post.update({ where: { id: params.id }, data: { commentsCount: { increment: 1 } } });
    if (post.userId !== user.id) {
      await tx.notification.create({
        data: { userId: post.userId, type: 'comment', message: `${user.name} commented on your post.` },
      });
    }
    return created;
  });

  return NextResponse.json({ comment }, { status: 201 });
}
