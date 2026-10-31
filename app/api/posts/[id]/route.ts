import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const editSchema = z
  .object({
    caption: z.string().trim().min(1).max(2000).optional(),
    mediaUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
  })
  .refine((d) => d.caption !== undefined || d.mediaUrl !== undefined, {
    message: 'Nothing to update',
  });

// Edit your own post: caption and/or photo. Only the post's author may edit.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.userId !== user.id) {
    return NextResponse.json({ error: 'You can only edit your own posts' }, { status: 403 });
  }

  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Caption is required (up to 2000 characters)' }, { status: 400 });
  }

  const data: { caption?: string; mediaUrl?: string | null } = {};
  if (parsed.data.caption !== undefined) data.caption = parsed.data.caption;
  if (parsed.data.mediaUrl !== undefined) data.mediaUrl = parsed.data.mediaUrl || null;

  const updated = await prisma.post.update({
    where: { id: post.id },
    data,
    include: {
      user: { select: userPublicSelect },
      likes: { where: { userId: user.id }, select: { id: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    post: {
      id: updated.id,
      caption: updated.caption,
      mediaUrl: updated.mediaUrl,
      createdAt: updated.createdAt,
      likesCount: updated._count.likes,
      commentsCount: updated._count.comments,
      likedByMe: updated.likes.length > 0,
      user: updated.user,
    },
  });
}
