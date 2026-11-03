'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setBusy(false);
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.webp" alt="DROP SPOT" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-sm text-slate-500">We’ll email you a reset link</p>
          </div>
        </div>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-700">
              If an account exists for <strong>{email}</strong>, a password reset link is on its
              way. It expires in 30 minutes.
            </p>
            <Link href="/login" className="block text-center text-sm font-semibold text-brand-500">
              Back to log in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
            <Link href="/login" className="block text-center text-sm font-semibold text-brand-500">
              Back to log in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
