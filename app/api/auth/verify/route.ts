import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, userPublicSelect } from '@/lib/prisma';
import { setSessionCookie, signSession } from '@/lib/auth';
import { VERIFY_MAX_ATTEMPTS, codesEqual, hashVerificationCode } from '@/lib/verification';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter the 6-digit code from your email' }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (user.emailVerified) {
    return NextResponse.json({ error: 'This email is already verified — you can sign in' }, { status: 400 });
  }

  const record = await prisma.verificationCode.findFirst({
    where: { userId: user.id, channel: 'email', consumed: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'That code has expired — ask for a new one' }, { status: 400 });
  }
  if (record.attempts >= VERIFY_MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many tries — ask for a new code' }, { status: 429 });
  }
  if (!codesEqual(hashVerificationCode(code), record.codeHash)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return NextResponse.json({ error: 'Incorrect code — try again' }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.verificationCode.updateMany({
      where: { userId: user.id, channel: 'email', consumed: false },
      data: { consumed: true },
    });
    return tx.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
      select: userPublicSelect,
    });
  });

  setSessionCookie(signSession(user.id));
  return NextResponse.json({ user: updated });
}
