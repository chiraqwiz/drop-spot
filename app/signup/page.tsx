'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        username: username || undefined,
        password,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not create your account');
      return;
    }
    router.push('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.webp" alt="DROP SPOT" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">DROP SPOT</h1>
            <p className="text-sm text-slate-500">Create your account</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="Username (optional)"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ characters)"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-500">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
