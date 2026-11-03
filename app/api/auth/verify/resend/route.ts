import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isEmailConfigured, sendVerificationEmail } from '@/lib/mail';
import {
  VERIFY_CODE_TTL_MS,
  VERIFY_RESEND_COOLDOWN_MS,
  generateVerificationCode,
  hashVerificationCode,
} from '@/lib/verification';

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (user.emailVerified) {
    return NextResponse.json({ error: 'This email is already verified — you can sign in' }, { status: 400 });
  }

  const last = await prisma.verificationCode.findFirst({
    where: { userId: user.id, channel: 'email', consumed: false },
    orderBy: { createdAt: 'desc' },
  });
  if (last && Date.now() - last.createdAt.getTime() < VERIFY_RESEND_COOLDOWN_MS) {
    return NextResponse.json({ error: 'A code was just sent — check your inbox first' }, { status: 429 });
  }

  const code = generateVerificationCode();
  await prisma.$transaction(async (tx) => {
    await tx.verificationCode.updateMany({
      where: { userId: user.id, channel: 'email', consumed: false },
      data: { consumed: true },
    });
    await tx.verificationCode.create({
      data: {
        userId: user.id,
        channel: 'email',
        codeHash: hashVerificationCode(code),
        expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
      },
    });
  });

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'Email is not configured right now — try again later' }, { status: 503 });
  }
  await sendVerificationEmail(email, user.name, code).catch(() => null);
  return NextResponse.json({ ok: true });
}
