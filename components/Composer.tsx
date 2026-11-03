'use client';

import { useRef, useState } from 'react';
import { Avatar } from './ui';
import PhotoCropper, { type AspectOption } from './PhotoCropper';

export const POST_ASPECTS: AspectOption[] = [
  { label: 'Original', value: 'original' },
  { label: 'Square', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
];

export type FeedPost = {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
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
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isImage && !isVideo) {
      setError('Please choose a photo or video file.');
      return;
    }
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(isVideo ? 'Video must be 50MB or smaller.' : 'Image must be 5MB or smaller.');
      return;
    }
    setError('');
    if (isVideo) {
      setFile(f);
      setMediaKind('video');
      setPreview(URL.createObjectURL(f));
      return;
    }
    setMediaKind('image');
    setCropFile(f);
    setCropSrc(URL.createObjectURL(f));
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
      body: JSON.stringify({
        caption: caption.trim(),
        mediaUrl: finalMediaUrl,
        ...(finalMediaUrl ? { mediaType: mediaKind ?? 'image' } : {}),
      }),
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
    setMediaKind(null);
    setPreview(null);
    setShowMedia(false);
    onPosted(data.post);
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      {cropSrc && cropFile && (
        <PhotoCropper
          imageSrc={cropSrc}
          originalFile={cropFile}
          aspects={POST_ASPECTS}
          title="Crop photo"
          onClose={() => {
            setCropSrc(null);
            setCropFile(null);
          }}
          onDone={(cropped) => {
            setFile(cropped);
            setMediaKind('image');
            setPreview(URL.createObjectURL(cropped));
            setCropSrc(null);
            setCropFile(null);
          }}
        />
      )}
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
              {preview &&
                (mediaKind === 'video' ? (
                  <video
                    src={preview}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-64 w-full rounded-2xl bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Photo preview" className="max-h-64 w-full rounded-2xl object-cover" />
                ))}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  {file ? 'Change photo/video' : 'Upload a photo or video'}
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setMediaKind(null);
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
                  accept="image/*,video/*"
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
