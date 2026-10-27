import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const [messages, unreadGroups] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: me.id }, { receiverId: me.id }] },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        sender: { select: userPublicSelect },
        receiver: { select: userPublicSelect },
      },
    }),
    prisma.message.groupBy({
      by: ['senderId'],
      where: { receiverId: me.id, read: false },
      _count: { _all: true },
    }),
  ]);

  const unreadBySender = new Map(unreadGroups.map((g) => [g.senderId, g._count._all]));
  const byOther = new Map<string, any>();
  for (const m of messages) {
    const other = m.senderId === me.id ? m.receiver : m.sender;
    if (!byOther.has(other.id)) {
      byOther.set(other.id, {
        user: other,
        lastMessage: {
          id: m.id,
          body: m.body,
          createdAt: m.createdAt,
          fromMe: m.senderId === me.id,
        },
        unread: unreadBySender.get(other.id) ?? 0,
      });
    }
  }

  const conversations = Array.from(byOther.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
  );
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return NextResponse.json({ conversations, totalUnread });
}
