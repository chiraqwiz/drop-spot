'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Avatar, timeAgo } from './ui';
import type { FeedPost } from './Composer';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; username: string; avatarUrl: string | null };
};

export default function PostCard({ post: initial, meId }: { post: FeedPost; meId?: string }) {
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const isMine = !!meId && meId === post.user.id;
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  async function toggleLike() {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setPost((p) => ({
      ...p,
      likedByMe: data.liked,
      likesCount: p.likesCount + (data.liked ? 1 : -1),
    }));
  }

  async function loadComments() {
    if (comments) return;
    const res = await fetch(`/api/posts/${post.id}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  }

  async function addComment() {
    if (!draft.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: draft.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return;
    setComments((c) => [...(c ?? []), data.comment]);
    setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
    setDraft('');
  }

  function startEdit() {
    setEditCaption(post.caption ?? '');
    setEditMediaUrl(post.mediaUrl ?? '');
    setEditFile(null);
    setEditPreview(null);
    setEditError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditFile(null);
    setEditPreview(null);
    setEditError('');
  }

  function pickEdit(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setEditError('Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setEditError('Image must be 5MB or smaller.');
      return;
    }
    setEditError('');
    setEditFile(f);
    setEditPreview(URL.createObjectURL(f));
  }

  async function saveEdit() {
    if (!editCaption.trim()) {
      setEditError('Caption is required.');
      return;
    }
    setSaving(true);
    setEditError('');

    let finalMediaUrl = editMediaUrl;
    if (editFile) {
      const form = new FormData();
      form.append('file', editFile);
      const up = await fetch('/api/upload', { method: 'POST', body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok) {
        setEditError(upData.error ?? 'Photo upload failed.');
        setSaving(false);
        return;
      }
      finalMediaUrl = upData.url;
    }

    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: editCaption.trim(), mediaUrl: finalMediaUrl }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setEditError(data.error ?? 'Could not save. Try again.');
      return;
    }
    setPost((p) => ({ ...p, ...data.post }));
    setEditing(false);
    setEditFile(null);
    setEditPreview(null);
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.user.username}`} className="flex items-center gap-3">
          <Avatar name={post.user.name} avatarUrl={post.user.avatarUrl} />
          <div>
            <p className="font-semibold hover:underline">{post.user.name}</p>
            <p className="text-xs text-slate-500">
              @{post.user.username} • {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        {isMine && !editing && (
          <button onClick={startEdit} className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 px-4 pb-4">
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
          />
          {(editPreview || editMediaUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editPreview ?? editMediaUrl} alt="" className="h-64 w-full rounded-2xl object-cover" />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => editInputRef.current?.click()}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {editFile || editMediaUrl ? 'Change photo' : 'Add a photo'}
            </button>
            {(editFile || editMediaUrl) && (
              <button
                type="button"
                onClick={() => {
                  setEditFile(null);
                  setEditPreview(null);
                  setEditMediaUrl('');
                }}
                className="text-sm text-slate-500"
              >
                Remove
              </button>
            )}
            <input
              ref={editInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickEdit(e.target.files?.[0])}
            />
          </div>
          {!editFile && (
            <input
              value={editMediaUrl}
              onChange={(e) => setEditMediaUrl(e.target.value)}
              placeholder="Or paste an image URL (empty removes the photo)"
              className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          )}
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {post.caption && <p className="px-4 pb-3 text-sm leading-6 text-slate-700">{post.caption}</p>}
          {post.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.mediaUrl} alt="" className="h-80 w-full object-cover" />
          )}
        </>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
        <div className="flex gap-4">
          <button onClick={toggleLike} className={post.likedByMe ? 'font-semibold text-red-500' : 'hover:text-red-500'}>
            ❤ {post.likesCount}
          </button>
          <button
            onClick={() => {
              setShowComments((v) => !v);
              loadComments();
            }}
            className="hover:text-brand-500"
          >
            💬 {post.commentsCount}
          </button>
        </div>
        <span>Share</span>
      </div>

      {showComments && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="space-y-3">
            {(comments ?? []).map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar name={c.user.name} avatarUrl={c.user.avatarUrl} size="sm" />
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm">
                  <p className="font-semibold">{c.user.name}</p>
                  <p className="text-slate-700">{c.body}</p>
                </div>
              </div>
            ))}
            {comments !== null && comments.length === 0 && (
              <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="Write a comment…"
              className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={addComment}
              disabled={busy || !draft.trim()}
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
