'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not log in');
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
            <p className="text-sm text-slate-500">Log in to your account</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-brand-500">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
