import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const createSchema = z
  .object({
    caption: z.string().trim().max(500).optional(),
    mediaUrl: z.string().trim().url().max(2048).optional(),
  })
  .refine((d) => (d.caption && d.caption.length > 0) || (d.mediaUrl && d.mediaUrl.length > 0), {
    message: 'A story needs text or a photo',
  });

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const follows = await prisma.follow.findMany({
    where: { followerId: me.id },
    select: { followingId: true },
  });
  const audienceIds = follows.length > 0 ? [...follows.map((f) => f.followingId), me.id] : undefined;

  const stories = await prisma.story.findMany({
    where: {
      ...(audienceIds ? { userId: { in: audienceIds } } : {}),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: userPublicSelect },
      views: { where: { viewerId: me.id }, select: { storyId: true } },
    },
  });

  const byUser = new Map<string, { user: (typeof stories)[number]['user']; stories: any[] }>();
  for (const s of stories) {
    const seen = s.views.length > 0;
    const entry = byUser.get(s.userId) ?? { user: s.user, stories: [] };
    entry.stories.push({
      id: s.id,
      caption: s.caption,
      mediaUrl: s.mediaUrl,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      seen,
    });
    byUser.set(s.userId, entry);
  }

  const groups = Array.from(byUser.values())
    .map((g) => ({
      ...g,
      hasUnseen: g.stories.some((s) => !s.seen),
      latestAt: g.stories[g.stories.length - 1].createdAt,
    }))
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'A story needs text or a photo' }, { status: 400 });
  }

  const story = await prisma.story.create({
    data: {
      userId: me.id,
      caption: parsed.data.caption || null,
      mediaUrl: parsed.data.mediaUrl || null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ story }, { status: 201 });
}
