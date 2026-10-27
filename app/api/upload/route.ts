import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSessionUser } from '@/lib/auth';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const blob = await put(`avatars/${user.id}-${Date.now()}-${safeName}`, file, {
    access: 'public',
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
