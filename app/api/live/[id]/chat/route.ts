import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });

  const sinceParam = new URL(req.url).searchParams.get('since');
  const since = sinceParam ? new Date(sinceParam) : new Date(0);

  const messages = await prisma.liveChatMessage.findMany({
    where: { streamId: stream.id, createdAt: { gt: since } },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: { author: { select: userPublicSelect } },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const stream = await prisma.liveStream.findUnique({ where: { id: params.id } });
  if (!stream) return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
  if (stream.status !== 'LIVE') {
    return NextResponse.json({ error: 'This stream is not live.' }, { status: 409 });
  }

  let body = '';
  try {
    body = (await req.json())?.body ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  body = String(body).trim().slice(0, 500);
  if (!body) return NextResponse.json({ error: 'Message is empty' }, { status: 400 });

  const message = await prisma.liveChatMessage.create({
    data: { streamId: stream.id, authorId: user.id, body },
    include: { author: { select: userPublicSelect } },
  });
  return NextResponse.json({ message }, { status: 201 });
}
