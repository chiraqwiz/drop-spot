'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gamepad2, Play } from 'lucide-react';

const GAMES = [
  {
    slug: 'retro-fighter',
    title: 'Retro Fighter',
    tagline: '12 fighters, 5 Chicago stages — arcade, 2P or friend match online. Every fighter packs a Mortal Kombat legend\'s signature move.',
    art: '🥊',
  },
  {
    slug: 'halloween-chase',
    title: 'Halloween Chase',
    tagline: 'Maze Chase — outrun the ghosts, grab every dot.',
    art: '🎃',
  },
];

export default function GamesPage() {
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
        Loading games…
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
        <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
          <Gamepad2 className="h-6 w-6 text-brand-500" /> Games
        </h1>
        <p className="mb-5 text-sm text-slate-500">
          Play right here — no downloads, no extra accounts.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              href={`/games/${g.slug}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-soft transition hover:shadow-lg"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-6xl">
                {g.art}
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-bold">{g.title}</p>
                  <p className="text-sm text-slate-500">{g.tagline}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white transition group-hover:scale-105">
                  <Play className="h-5 w-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
