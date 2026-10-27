'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui';

type Conversation = {
  user: { id: string; name: string; username: string; avatarUrl: string | null };
  lastMessage: { id: string; body: string; createdAt: string; fromMe: boolean };
  unread: number;
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      setConversations((await res.json()).conversations);
      setLoading(false);
    })();
  }, [router]);

  async function search(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/users?q=${encodeURIComponent(q.trim())}`);
    if (res.ok) setResults((await res.json()).users);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading messages…
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
        <h1 className="mb-4 text-xl font-bold">Messages</h1>

        <div className="relative mb-4">
          <input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search people to message…"
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-soft outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          {results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-2 rounded-2xl bg-white p-2 shadow-soft">
              {results.map((u) => (
                <Link
                  key={u.id}
                  href={`/messages/${u.username}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-100"
                >
                  <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                  <span>
                    <span className="block text-sm font-semibold">{u.name}</span>
                    <span className="block text-xs text-slate-500">@{u.username}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {conversations.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
              <p className="font-semibold">No messages yet</p>
              <p className="mt-1 text-sm text-slate-500">Search above to start a conversation.</p>
            </div>
          )}
          {conversations.map((c) => (
            <Link
              key={c.user.id}
              href={`/messages/${c.user.username}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft"
            >
              <Avatar name={c.user.name} avatarUrl={c.user.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.user.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(c.lastMessage.createdAt)}</span>
                </span>
                <span className={`block truncate text-sm ${c.unread > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                  {c.lastMessage.fromMe ? 'You: ' : ''}
                  {c.lastMessage.body}
                </span>
              </span>
              {c.unread > 0 && (
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-bold text-white">
                  {c.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
