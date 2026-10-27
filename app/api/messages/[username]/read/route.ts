import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { username: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const other = await prisma.user.findUnique({
    where: { username: params.username },
    select: { id: true },
  });
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const result = await prisma.message.updateMany({
    where: { senderId: other.id, receiverId: me.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ marked: result.count });
}
