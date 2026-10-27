import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/)
    .optional(),
  bio: z.string().trim().max(200).optional(),
  avatarUrl: z.string().trim().url().max(2048).optional().or(z.literal('')),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile details' }, { status: 400 });
  }

  const { username, ...rest } = parsed.data;
  if (username && username !== user.username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) return NextResponse.json({ error: 'That username is taken' }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...rest,
      ...(parsed.data.avatarUrl !== undefined
        ? { avatarUrl: parsed.data.avatarUrl || null }
        : {}),
      ...(username ? { username } : {}),
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const [followers, following, posts] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.post.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      counts: { followers, following, posts },
    },
  });
}
