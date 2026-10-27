'use client';

import { useRef, useState } from 'react';
import { Avatar } from './ui';

export type FeedPost = {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  user: { id: string; name: string; username: string; avatarUrl: string | null; isVerified: boolean };
};

export default function Composer({
  meName,
  meAvatarUrl,
  onPosted,
}: {
  meName: string;
  meAvatarUrl?: string | null;
  onPosted: (post: FeedPost) => void;
}) {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMedia, setShowMedia] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!caption.trim()) return;
    setBusy(true);
    setError('');

    let finalMediaUrl = mediaUrl.trim() || undefined;
    if (file) {
      const form = new FormData();
      form.append('file', file);
      const up = await fetch('/api/upload', { method: 'POST', body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok) {
        setError(upData.error ?? 'Photo upload failed.');
        setBusy(false);
        return;
      }
      finalMediaUrl = upData.url;
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: caption.trim(), mediaUrl: finalMediaUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not post. Try again.');
      return;
    }
    setCaption('');
    setMediaUrl('');
    setFile(null);
    setPreview(null);
    setShowMedia(false);
    onPosted(data.post);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-start gap-3">
        <Avatar name={meName} avatarUrl={meAvatarUrl} />
        <div className="flex-1">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          {showMedia && (
            <div className="mt-2 space-y-2">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Photo preview" className="max-h-64 w-full rounded-2xl object-cover" />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  {file ? 'Change photo' : 'Upload a photo'}
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="text-sm text-slate-500"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </div>
              {!file && (
                <input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Or paste an image URL (optional)"
                  className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          )}
        </div>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <button
          onClick={() => setShowMedia((v) => !v)}
          className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Photo
        </button>
        <button
          onClick={submit}
          disabled={busy || !caption.trim()}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
