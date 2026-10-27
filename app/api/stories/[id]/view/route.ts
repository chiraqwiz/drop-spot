import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const story = await prisma.story.findFirst({
    where: { id: params.id, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId: params.id, viewerId: me.id } },
    update: {},
    create: { storyId: params.id, viewerId: me.id },
  });

  return NextResponse.json({ seen: true });
}
