'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function HalloweenChasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading game…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/games" className="flex items-center gap-2 text-sm font-semibold text-brand-500">
            <ArrowLeft className="h-4 w-4" /> All games
          </Link>
          <span className="font-bold">🎃 Halloween Chase</span>
          <span className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4 pb-10">
        <iframe
          src="/games/halloween-chase.html"
          title="Halloween Chase"
          className="h-[78vh] w-full rounded-2xl border-0 bg-[#0b0e26] shadow-soft"
          allow="autoplay; fullscreen"
        />
        <p className="mt-3 text-center text-xs text-slate-400">
          Tip: tap the game first, then use arrow keys or swipe to move.
        </p>
      </div>
    </main>
  );
}
