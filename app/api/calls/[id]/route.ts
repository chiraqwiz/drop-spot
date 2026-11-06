import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

const schema = z.object({ action: z.enum(['accept', 'decline', 'end']) });

// Accept / decline / end a call invite. Only participants may act.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const invite = await prisma.callInvite.findUnique({
    where: { id: params.id },
    include: {
      caller: { select: userPublicSelect },
      receiver: { select: userPublicSelect },
    },
  });
  if (!invite || (invite.callerId !== me.id && invite.receiverId !== me.id)) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const { action } = parsed.data;
  if (action === 'end') {
    if (invite.status === 'ENDED') return NextResponse.json({ ok: true });
    await prisma.callInvite.update({ where: { id: invite.id }, data: { status: 'ENDED' } });
    return NextResponse.json({ ok: true });
  }

  // accept / decline are the receiver's call, and only while it's still ringing.
  if (invite.receiverId !== me.id) {
    return NextResponse.json({ error: 'Only the person being called can do that' }, { status: 403 });
  }
  if (invite.status !== 'PENDING') {
    return NextResponse.json({ error: 'This call is no longer ringing' }, { status: 409 });
  }
  const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
  await prisma.callInvite.update({ where: { id: invite.id }, data: { status } });
  return NextResponse.json({ ok: true, status, roomId: invite.roomId });
}
