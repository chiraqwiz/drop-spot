'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Play, Radio, Send } from 'lucide-react';
import { Avatar } from '@/components/ui';

type StreamDetail = {
  id: string;
  title: string;
  status: 'CREATED' | 'LIVE' | 'ENDED';
  playbackUrl: string;
  startedAt: string | null;
  broadcaster: { id: string; name: string; username: string; avatarUrl: string | null };
  isMine: boolean;
  viewerCount: number | null;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
};

export default function WatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ load: (u: string) => void; play: () => void; pause: () => void; delete: () => void } | null>(null);
  const [stream, setStream] = useState<StreamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/live/${params.id}`);
    if (res.status === 401) {
      router.replace('/login');
      return;
    }
    if (res.ok) {
      const d = await res.json();
      setStream(d.stream);
    }
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    loadDetail();
    const t = setInterval(loadDetail, 15000);
    return () => clearInterval(t);
  }, [loadDetail]);

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.delete();
      } catch {
        // ignore
      }
    };
  }, []);

  async function startWatching() {
    if (!stream || watching) return;
    setPlayerError('');
    try {
      const w = window as unknown as { IVSPlayer?: any };
      if (!w.IVSPlayer) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://player.live-video.net/1.58.0/amazon-ivs-player.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('player script failed'));
          document.head.appendChild(s);
        });
      }
      const IVSPlayer = (window as unknown as { IVSPlayer: any }).IVSPlayer;
      if (!IVSPlayer.isPlayerSupported) {
        setPlayerError('Live playback is not supported in this browser.');
        return;
      }
      const player = IVSPlayer.create();
      playerRef.current = player;
      if (videoRef.current) player.attachHTMLVideoElement(videoRef.current);
      player.load(stream.playbackUrl);
      await player.play();
      setWatching(true);
    } catch (e) {
      console.error(e);
      setPlayerError('Could not start playback. Please try again.');
    }
  }

  const loadChat = useCallback(async () => {
    const since = messages.length
      ? messages[messages.length - 1].createdAt
      : new Date(0).toISOString();
    const res = await fetch(`/api/live/${params.id}/chat?since=${encodeURIComponent(since)}`);
    if (res.ok) {
      const d = await res.json();
      if (d.messages?.length) {
        setMessages((m) => {
          const seen = new Set(m.map((x) => x.id));
          return [...m, ...d.messages.filter((x: ChatMessage) => !seen.has(x.id))];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, messages.length]);

  useEffect(() => {
    if (stream?.status !== 'LIVE') return;
    loadChat();
    const t = setInterval(loadChat, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.status, params.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function sendChat() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch(`/api/live/${params.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (res.ok) {
      setDraft('');
      loadChat();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <p className="p-8 text-center text-sm text-slate-400">Loading stream…</p>
      </main>
    );
  }

  if (!stream) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="p-8 text-center">
          <p className="font-semibold">Stream not found</p>
          <Link href="/live" className="mt-3 inline-block text-sm font-semibold text-brand-400">
            ← Back to Live
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/live" className="text-sm font-semibold text-brand-400">
            ← Live
          </Link>
          <Avatar
            name={stream.broadcaster.name}
            avatarUrl={stream.broadcaster.avatarUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{stream.broadcaster.name}</p>
            {stream.title && <p className="truncate text-xs text-slate-400">{stream.title}</p>}
          </div>
          {stream.status === 'LIVE' && (
            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          )}
          {stream.isMine && stream.status !== 'ENDED' && (
            <Link
              href={`/live/${stream.id}/studio`}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"
            >
              Open Studio
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="aspect-video w-full" playsInline controls={watching} />
          {stream.status === 'LIVE' && !watching && (
            <button
              onClick={startWatching}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
                <Play className="h-8 w-8 fill-white text-white" />
              </span>
              <span className="text-sm font-semibold">Tap to watch live</span>
            </button>
          )}
          {stream.status === 'CREATED' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-sm text-slate-300">Starting soon…</p>
            </div>
          )}
          {stream.status === 'ENDED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
              <Radio className="h-8 w-8 text-slate-500" />
              <p className="text-sm text-slate-300">This stream has ended.</p>
            </div>
          )}
        </div>
        {playerError && <p className="mt-2 text-center text-sm text-red-300">{playerError}</p>}
        {stream.viewerCount !== null && stream.status === 'LIVE' && (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Eye className="h-3.5 w-3.5" /> {stream.viewerCount} watching
          </p>
        )}

        {stream.status === 'LIVE' && (
          <div className="mt-4 rounded-2xl bg-white/5 p-3">
            <h2 className="mb-2 text-sm font-bold text-slate-200">Live chat</h2>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-brand-400">{m.author.name}</span>
                  <span className="text-slate-200">{m.body}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
              {messages.length === 0 && (
                <p className="text-xs text-slate-500">Say hi — be the first to chat.</p>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Chat…"
                maxLength={500}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-brand-500"
              />
              <button
                onClick={sendChat}
                disabled={sending || !draft.trim()}
                aria-label="Send chat message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
