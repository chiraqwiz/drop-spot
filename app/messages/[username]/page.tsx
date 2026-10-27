'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui';

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  fromMe: boolean;
};

export default function ThreadPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (markRead: boolean) => {
      const res = await fetch(`/api/messages/${params.username}`);
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      setMessages(data.messages);
      if (markRead) {
        fetch(`/api/messages/${params.username}/read`, { method: 'POST' }).catch(() => {});
      }
    },
    [params.username, router],
  );

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(true), 4000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/messages/${params.username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not send your message.');
      return;
    }
    setInput('');
    const data = await res.json();
    setMessages((m) => [...m, data.message]);
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 text-slate-600">
        <p>That person does not exist.</p>
        <Link href="/messages" className="font-semibold text-brand-500">
          Back to messages
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/messages" className="text-sm font-semibold text-brand-500">
            ← Chats
          </Link>
          {user && (
            <Link href={`/profile/${user.username}`} className="flex items-center gap-2">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
              <span className="font-semibold">{user.name}</span>
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-slate-500">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`mb-2 flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                m.fromMe ? 'bg-brand-500 text-white' : 'bg-white text-slate-900 shadow-soft'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={`mt-1 text-right text-[11px] ${m.fromMe ? 'text-white/70' : 'text-slate-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white">
        <form onSubmit={send} className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
            className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
        {error && <p className="mx-auto max-w-2xl px-4 pb-3 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
