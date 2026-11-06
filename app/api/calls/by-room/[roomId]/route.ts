import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma, userPublicSelect } from '@/lib/prisma';

// Look up a call invite by its room id. Only the two participants may see it.
export async function GET(_req: Request, { params }: { params: { roomId: string } }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const invite = await prisma.callInvite.findUnique({
    where: { roomId: params.roomId },
    include: {
      caller: { select: userPublicSelect },
      receiver: { select: userPublicSelect },
    },
  });
  if (!invite || (invite.callerId !== me.id && invite.receiverId !== me.id)) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const peer = invite.callerId === me.id ? invite.receiver : invite.caller;
  return NextResponse.json({
    invite: {
      id: invite.id,
      roomId: invite.roomId,
      status: invite.status,
      isCaller: invite.callerId === me.id,
      peer,
    },
  });
}
