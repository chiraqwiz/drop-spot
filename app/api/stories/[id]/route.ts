import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const story = await prisma.story.findFirst({
    where: { id: params.id, userId: me.id },
    select: { id: true },
  });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  await prisma.story.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
