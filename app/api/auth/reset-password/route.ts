import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const bodySchema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
});

async function findValidToken(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

// Check whether a reset link is still valid (used by the reset page).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? '';
  const valid = token ? (await findValidToken(token)) !== null : false;
  return NextResponse.json({ valid });
}

// Set a new password with a valid, unused, unexpired token. Single use: the
// token is marked used and every other token for the user is removed.
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const record = await findValidToken(parsed.data.token);
  if (!record) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
