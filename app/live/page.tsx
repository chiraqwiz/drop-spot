'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';
import { Avatar } from '@/components/ui';

type LiveStreamCard = {
  id: string;
  title: string;
  startedAt: string | null;
  broadcaster: { id: string; name: string; username: string; avatarUrl: string | null };
};

export default function LiveHubPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<LiveStreamCard[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/live');
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setStreams(d.streams);
      setConfigured(d.liveConfigured);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  async function goLive() {
    setStarting(true);
    setError('');
    const res = await fetch('/api/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const d = await res.json().catch(() => ({}));
    setStarting(false);
    if (!res.ok) {
      setError(d.error || 'Could not go live. Please try again.');
      return;
    }
    router.push(`/live/${d.id}/studio`);
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Link href="/" className="text-sm font-semibold text-brand-500">
            ← Home
          </Link>
          <h1 className="flex flex-1 items-center gap-2 text-lg font-bold">
            <Radio className="h-5 w-5 text-red-500" /> Live
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="font-bold">Share the moment, live</h2>
          <p className="mt-1 text-sm text-slate-500">
            Broadcast to everyone on DROP SPOT straight from your camera.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you going live about? (optional)"
            maxLength={120}
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            onClick={goLive}
            disabled={starting || !configured}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-bold text-white disabled:opacity-50"
          >
            <Radio className="h-5 w-5" />
            {starting ? 'Setting up…' : 'Go Live'}
          </button>
          {!configured && (
            <p className="mt-2 text-center text-xs text-slate-400">
              Live streaming is being set up — check back soon.
            </p>
          )}
        </div>

        <h2 className="font-bold">Live now</h2>
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && streams.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
            <p className="font-semibold">Nobody is live right now</p>
            <p className="mt-1 text-sm text-slate-500">Be the first — hit Go Live above.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {streams.map((s) => (
            <Link
              key={s.id}
              href={`/live/${s.id}`}
              className="rounded-2xl bg-white p-4 shadow-soft transition hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Avatar name={s.broadcaster.name} avatarUrl={s.broadcaster.avatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.broadcaster.name}</p>
                  <p className="truncate text-xs text-slate-500">@{s.broadcaster.username}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              </div>
              {s.title && <p className="mt-2 truncate text-sm text-slate-600">{s.title}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
