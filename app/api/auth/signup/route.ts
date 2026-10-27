import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, userPublicSelect } from '@/lib/prisma';
import { hashPassword, setSessionCookie, signSession, usernameFromEmail } from '@/lib/auth';

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup details' }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

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
    },
    select: userPublicSelect,
  });

  setSessionCookie(signSession(user.id));
  return NextResponse.json({ user }, { status: 201 });
}
