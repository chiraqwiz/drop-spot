'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(params.token)}`);
      setValid(res.ok && (await res.json().catch(() => ({}))).valid === true);
      setChecking(false);
    })();
  }, [params.token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The passwords don’t match.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not reset the password.');
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.webp" alt="DROP SPOT" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">New password</h1>
            <p className="text-sm text-slate-500">Choose a new password</p>
          </div>
        </div>
        {checking ? (
          <p className="text-sm text-slate-500">Checking your reset link…</p>
        ) : done ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-700">
              Your password was changed. You can log in with your new password now.
            </p>
            <Link
              href="/login"
              className="block rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-white"
            >
              Log in
            </Link>
          </div>
        ) : !valid ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-700">
              This reset link is invalid or has expired. Reset links last 30 minutes and can only
              be used once.
            </p>
            <Link href="/forgot-password" className="block text-center text-sm font-semibold text-brand-500">
              Send a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (8+ characters)"
              className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
