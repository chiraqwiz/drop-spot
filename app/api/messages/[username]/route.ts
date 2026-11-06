import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const sendSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    mediaUrl: z.string().trim().url().max(2048).optional(),
    mediaType: z.enum(['image', 'video']).optional(),
  })
  .refine((d) => (d.body && d.body.length > 0) || d.mediaUrl, {
    message: 'Message must have text or a photo/video',
  });

async function otherUser(username: string) {
  return prisma.user.findUnique({ where: { username }, select: userPublicSelect });
}

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const other = await otherUser(params.username);
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me.id, receiverId: other.id },
        { senderId: other.id, receiverId: me.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const messages = rows.reverse().map((m) => ({
    id: m.id,
    body: m.body,
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
    createdAt: m.createdAt,
    fromMe: m.senderId === me.id,
  }));

  return NextResponse.json({ user: other, messages });
}

export async function POST(req: Request, { params }: { params: { username: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const other = await otherUser(params.username);
  if (!other) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (other.id === me.id) return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 });

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Message must have text or a photo/video' }, { status: 400 });
  }

  const body = parsed.data.body && parsed.data.body.length > 0 ? parsed.data.body : null;
  const message = await prisma.message.create({
    data: {
      senderId: me.id,
      receiverId: other.id,
      body,
      mediaUrl: parsed.data.mediaUrl ?? null,
      mediaType: parsed.data.mediaUrl ? (parsed.data.mediaType ?? 'image') : null,
    },
  });
  const notifLabel = parsed.data.mediaUrl
    ? parsed.data.mediaType === 'video'
      ? 'sent you a video'
      : 'sent you a photo'
    : 'sent you a message';
  await prisma.notification.create({
    data: {
      userId: other.id,
      type: 'message',
      message: `${me.name} ${notifLabel}`,
    },
  });

  return NextResponse.json(
    {
      message: {
        id: message.id,
        body: message.body,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        createdAt: message.createdAt,
        fromMe: true,
      },
    },
    { status: 201 },
  );
}
