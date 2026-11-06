'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, PhoneOff, Video, X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { uploadFile } from '@/lib/blobUpload';
import { startIncomingRing, stopRing, warmUpAudio } from '@/lib/ringtone';

type ChatMessage = {
  id: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  fromMe: boolean;
};

type IncomingCall = {
  id: string;
  roomId: string;
  createdAt: string;
  caller: { name: string; username: string; avatarUrl: string | null };
};

export default function ThreadPage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [calling, setCalling] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      // Ring check: is this friend calling me right now?
      try {
        const callRes = await fetch(`/api/calls/pending?peer=${encodeURIComponent(params.username)}`);
        if (callRes.ok) {
          const { invites } = await callRes.json();
          setIncomingCall(invites.length > 0 ? invites[0] : null);
        }
      } catch {
        /* calls are best-effort on top of chat */
      }
      if (markRead) {
        fetch(`/api/messages/${params.username}/read`, { method: 'POST' }).catch(() => {});
      }
    },
    [params.username, router],
  );

  async function startCall() {
    if (!user || calling) return;
    warmUpAudio();
    setCalling(true);
    setError('');
    const res = await fetch('/api/calls/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: user.id }),
    });
    setCalling(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not start the call.');
      return;
    }
    const { invite } = await res.json();
    router.push(`/calls/${invite.roomId}`);
  }

  async function answerCall(accept: boolean) {
    if (!incomingCall) return;
    stopRing();
    const res = await fetch(`/api/calls/${incomingCall.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: accept ? 'accept' : 'decline' }),
    });
    if (accept && res.ok) {
      router.push(`/calls/${incomingCall.roomId}`);
    } else {
      setIncomingCall(null);
    }
  }

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(true), 4000);
    return () => {
      clearInterval(timer);
      stopRing();
    };
  }, [load]);

  // Ring while an incoming call banner is showing.
  useEffect(() => {
    if (incomingCall) startIncomingRing();
    else stopRing();
  }, [incomingCall]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if ((!body && !mediaFile) || sending || uploading) return;
    setSending(true);
    setError('');

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    if (mediaFile) {
      setUploading(true);
      try {
        mediaUrl = await uploadFile(mediaFile);
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      } catch {
        setUploading(false);
        setSending(false);
        setError('Could not upload that file. Please try again.');
        return;
      }
      setUploading(false);
    }

    const res = await fetch(`/api/messages/${params.username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(body ? { body } : {}),
        ...(mediaUrl ? { mediaUrl, mediaType } : {}),
      }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not send your message.');
      return;
    }
    setInput('');
    clearMedia();
    const data = await res.json();
    setMessages((m) => [...m, data.message]);
  }

  function pickMedia(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) {
      setError('Please choose a photo or video.');
      return;
    }
    setError('');
    setMediaFile(f);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(URL.createObjectURL(f));
  }

  function clearMedia() {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
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
            <Link href={`/profile/${user.username}`} className="flex flex-1 items-center gap-2">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
              <span className="font-semibold">{user.name}</span>
            </Link>
          )}
          {user && (
            <button
              onClick={startCall}
              disabled={calling}
              title="Start video call"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft disabled:opacity-50"
            >
              <Video className="h-5 w-5" />
            </button>
          )}
        </div>
        {incomingCall && (
          <div className="border-t border-slate-200 bg-brand-500 px-4 py-3 text-white">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Video className="h-5 w-5" />
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
              </span>
              <div className="flex-1">
                <p className="font-semibold">{incomingCall.caller.name} is calling…</p>
                <p className="text-xs text-white/80">Video call</p>
              </div>
              <button
                onClick={() => answerCall(true)}
                className="rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-600"
              >
                Join
              </button>
              <button
                onClick={() => answerCall(false)}
                aria-label="Decline call"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
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
              {m.mediaUrl && m.mediaType === 'video' && (
                <video
                  src={m.mediaUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="mb-1 max-h-64 w-full rounded-xl bg-black"
                />
              )}
              {m.mediaUrl && m.mediaType !== 'video' && (
                <img
                  src={m.mediaUrl}
                  alt="Shared photo"
                  className="mb-1 max-h-64 w-full rounded-xl object-cover"
                />
              )}
              {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
              <p className={`mt-1 text-right text-[11px] ${m.fromMe ? 'text-white/70' : 'text-slate-400'}`}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white">
        {mediaPreview && mediaFile && (
          <div className="mx-auto max-w-2xl px-4 pt-3">
            <div className="relative inline-block">
              {mediaFile.type.startsWith('video/') ? (
                <video src={mediaPreview} className="h-24 rounded-xl bg-black" />
              ) : (
                <img src={mediaPreview} alt="Attachment preview" className="h-24 rounded-xl object-cover" />
              )}
              <button
                type="button"
                onClick={clearMedia}
                aria-label="Remove attachment"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={send} className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => pickMedia(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach photo or video"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={startCall}
            disabled={calling || !user}
            aria-label="Start video call"
            title="Video call"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white disabled:opacity-50"
          >
            <Video className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
            className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={sending || uploading || (!input.trim() && !mediaFile)}
            className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Send'}
          </button>
        </form>
        {error && <p className="mx-auto max-w-2xl px-4 pb-3 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
