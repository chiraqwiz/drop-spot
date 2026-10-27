import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid login details' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  setSessionCookie(signSession(user.id));
  const { passwordHash: _passwordHash, ...publicUser } = user;
  void _passwordHash;
  return NextResponse.json({
    user: {
      id: publicUser.id,
      name: publicUser.name,
      username: publicUser.username,
      bio: publicUser.bio,
      avatarUrl: publicUser.avatarUrl,
      isVerified: publicUser.isVerified,
      createdAt: publicUser.createdAt,
    },
  });
}
