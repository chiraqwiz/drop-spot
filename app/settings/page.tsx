'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui';

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setName(data.user.name);
      setUsername(data.user.username);
      setBio(data.user.bio ?? '');
      setAvatarUrl(data.user.avatarUrl ?? null);
      setLoading(false);
    })();
  }, [router]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError('');
    setFile(f);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);

    let nextAvatarUrl: string | undefined;
    if (removePhoto) {
      nextAvatarUrl = '';
    } else if (file) {
      const form = new FormData();
      form.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok) {
        setError(upData.error ?? 'Photo upload failed.');
        setBusy(false);
        return;
      }
      nextAvatarUrl = upData.url;
    }

    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username,
        bio,
        ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not save your profile.');
      return;
    }
    setAvatarUrl(data.user.avatarUrl ?? null);
    setPreview(null);
    setFile(null);
    setRemovePhoto(false);
    setUsername(data.user.username);
    setSaved(true);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading settings…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.webp" alt="DROP SPOT" className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-bold">DROP SPOT</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-brand-500">
            Back to feed
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h1 className="text-xl font-bold">Edit profile</h1>
          <p className="mt-1 text-sm text-slate-500">This is what people see when they visit your profile.</p>

          <form onSubmit={save} className="mt-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={name || '?'} avatarUrl={preview ?? avatarUrl} size="lg" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Change photo
                </button>
                {avatarUrl && !removePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemovePhoto(true);
                      setFile(null);
                      setPreview(null);
                    }}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Remove photo
                  </button>
                )}
                {removePhoto && (
                  <button
                    type="button"
                    onClick={() => setRemovePhoto(false)}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Keep photo
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
            {removePhoto && <p className="text-sm text-slate-500">Your photo will be removed when you save.</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">Letters, numbers and underscores, 3–30 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="A little about you…"
                className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Profile saved.</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <Link href={`/profile/${username}`} className="text-sm font-semibold text-brand-500">
                View profile
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
