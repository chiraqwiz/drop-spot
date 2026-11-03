'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyLoading />}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <p className="text-sm text-slate-500">Loading…</p>
    </main>
  );
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmail(searchParams.get('email') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not verify. Try again.');
      return;
    }
    router.push('/');
  }

  async function resend() {
    if (cooldown > 0) return;
    setResending(true);
    setError('');
    setInfo('');
    const res = await fetch('/api/auth/verify/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setResending(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not resend the code.');
      return;
    }
    setCooldown(60);
    setInfo('A new code is on its way — check your inbox.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-soft">
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a 6-digit code to verify this email address is yours. It expires in 15 minutes.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-2 focus:ring-brand-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Verifying…' : 'Verify email'}
          </button>
        </form>
        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0 || !email}
          className="mt-3 w-full text-center text-sm font-semibold text-brand-500 disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending…' : "Didn't get a code? Resend it"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-brand-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
