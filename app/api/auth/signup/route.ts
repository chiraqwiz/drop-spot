import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, userPublicSelect } from '@/lib/prisma';
import { hashPassword, usernameFromEmail } from '@/lib/auth';
import { isEmailConfigured, sendVerificationEmail } from '@/lib/mail';
import { parseDob } from '@/lib/dob';
import {
  VERIFY_CODE_TTL_MS,
  generateVerificationCode,
  hashVerificationCode,
} from '@/lib/verification';

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/).optional(),
  dob: z.string(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  const dobResult = parseDob(parsed.data.dob);
  if ('error' in dobResult) {
    return NextResponse.json({ error: dobResult.error }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(parsed.data.username ? [{ username: parsed.data.username }] : [])] },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.email === email ? 'That email is already registered' : 'That username is taken' },
      { status: 409 },
    );
  }

  let username = parsed.data.username ?? usernameFromEmail(email);
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${usernameFromEmail(email)}${suffix}`;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      username,
      passwordHash: await hashPassword(password),
      emailVerified: false,
      dob: dobResult.date,
    },
    select: userPublicSelect,
  });

  // Send a verification code — the account stays unverified until it is entered.
  const code = generateVerificationCode();
  await prisma.verificationCode.create({
    data: {
      userId: user.id,
      channel: 'email',
      codeHash: hashVerificationCode(code),
      expiresAt: new Date(Date.now() + VERIFY_CODE_TTL_MS),
    },
  });
  if (isEmailConfigured()) {
    await sendVerificationEmail(email, name, code).catch(() => null);
  }

  return NextResponse.json({ user, needsVerification: true, email }, { status: 201 });
}
