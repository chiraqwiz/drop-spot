'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Avatar } from './ui';

export type StoryItem = {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
};

export type StoryGroup = {
  user: { id: string; name: string; username: string; avatarUrl: string | null };
  stories: StoryItem[];
  hasUnseen: boolean;
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Stories({
  groups,
  meUsername,
  onRefresh,
}: {
  groups: StoryGroup[];
  meUsername: string;
  onRefresh: () => void;
}) {
  const [viewer, setViewer] = useState<{ group: number; story: number } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const openGroup = (groupIndex: number) => {
    const group = groups[groupIndex];
    const firstUnseen = group.stories.findIndex((s) => !s.seen);
    setViewer({ group: groupIndex, story: firstUnseen === -1 ? 0 : firstUnseen });
  };

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex gap-4 overflow-x-auto pb-1">
          <button onClick={() => setComposerOpen(true)} className="flex shrink-0 flex-col items-center gap-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-500">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-xs text-slate-600">Add story</span>
          </button>

          {groups.map((g, i) => (
            <button key={g.user.id} onClick={() => openGroup(i)} className="flex shrink-0 flex-col items-center gap-1">
              <span
                className={`rounded-full p-[2px] ${
                  g.hasUnseen ? 'bg-gradient-to-tr from-brand-500 via-purple-500 to-amber-400' : 'bg-slate-300'
                }`}
              >
                <span className="block rounded-full border-2 border-white">
                  <Avatar name={g.user.name} avatarUrl={g.user.avatarUrl} size="lg" />
                </span>
              </span>
              <span className="max-w-[64px] truncate text-xs text-slate-600">
                {g.user.username === meUsername ? 'You' : g.user.username}
              </span>
            </button>
          ))}

          {groups.length === 0 && (
            <p className="self-center text-sm text-slate-500">
              No stories yet. Be the first to share one — it disappears in 24 hours.
            </p>
          )}
        </div>
      </div>

      {viewer && (
        <StoryViewer
          groups={groups}
          start={viewer}
          meUsername={meUsername}
          onClose={() => {
            setViewer(null);
            onRefresh();
          }}
          onDeleted={onRefresh}
        />
      )}

      {composerOpen && (
        <StoryComposer
          onClose={() => setComposerOpen(false)}
          onPosted={() => {
            setComposerOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

function StoryViewer({
  groups,
  start,
  meUsername,
  onClose,
  onDeleted,
}: {
  groups: StoryGroup[];
  start: { group: number; story: number };
  meUsername: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [pos, setPos] = useState(start);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const group = groups[pos.group];
  const story = group?.stories[pos.story];

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!group) return;
      let g = pos.group;
      let s = pos.story + dir;
      if (s < 0) {
        if (g === 0) return;
        g -= 1;
        s = groups[g].stories.length - 1;
      } else if (s >= group.stories.length) {
        if (g >= groups.length - 1) {
          onClose();
          return;
        }
        g += 1;
        s = 0;
      }
      setPos({ group: g, story: s });
    },
    [group, groups, onClose, pos],
  );

  useEffect(() => {
    if (!story) return;
    fetch(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(() => {});
    timer.current = setTimeout(() => go(1), 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [story, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!group || !story) return null;
  const mine = group.user.username === meUsername;

  async function deleteStory() {
    const res = await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex gap-1 px-4 pt-4">
        {group.stories.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className={`h-full bg-white ${i < pos.story ? 'w-full' : i === pos.story ? 'w-1/2' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar name={group.user.name} avatarUrl={group.user.avatarUrl} size="sm" />
          <span className="text-sm font-semibold">{group.user.username}</span>
          <span className="text-xs text-white/60">{timeAgo(story.createdAt)} ago</span>
        </div>
        <div className="flex items-center gap-3">
          {mine && (
            <button onClick={deleteStory} aria-label="Delete story" className="text-white/80 hover:text-white">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={onClose} aria-label="Close story" className="text-white/80 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden" onClick={() => go(1)}>
        {story.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="max-w-lg px-8 text-center text-2xl font-semibold leading-snug">{story.caption}</p>
        )}
        <button
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
        />
      </div>

      {story.mediaUrl && story.caption && (
        <p className="px-6 pb-6 text-center text-base">{story.caption}</p>
      )}
    </div>
  );
}

function StoryComposer({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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

  async function post() {
    if (!caption.trim() && !file) {
      setError('Add some text or a photo first.');
      return;
    }
    setBusy(true);
    setError('');

    let mediaUrl: string | undefined;
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
      mediaUrl = upData.url;
    }

    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: caption.trim() || undefined, mediaUrl }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not post your story.');
      return;
    }
    onPosted();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 text-slate-900 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add to your story</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Story preview" className="mb-4 max-h-64 w-full rounded-2xl object-cover" />
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Share a moment…"
          className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
        />

        <div className="mt-4 flex items-center gap-2">
          <label className="cursor-pointer rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            Add photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {file && (
            <button onClick={() => { setFile(null); setPreview(null); }} className="text-sm text-slate-500">
              Remove photo
            </button>
          )}
          <span className="flex-1" />
          <button
            onClick={post}
            disabled={busy}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Sharing…' : 'Share'}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="mt-3 text-xs text-slate-500">Stories disappear after 24 hours.</p>
      </div>
    </div>
  );
}
