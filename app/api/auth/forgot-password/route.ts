import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/mail';

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email() });

const APP_URL = process.env.APP_URL || 'https://drop-spot-eight.vercel.app';
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Always returns ok:true so the endpoint can't be used to probe which emails
// have accounts. When email isn't configured, the token is still created but
// no email goes out (logged server-side).
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && isEmailConfigured()) {
    // Keep only a few live tokens per user.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
    });
    const live = await prisma.passwordResetToken.count({ where: { userId: user.id } });
    if (live < 3) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });
      try {
        await sendPasswordResetEmail(user.email, user.name, `${APP_URL}/reset-password/${token}`);
      } catch (err) {
        console.error('Password reset email failed:', err);
      }
    }
  } else if (user) {
    console.warn('Password reset requested but email is not configured');
  }

  return NextResponse.json({ ok: true });
}
