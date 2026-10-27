'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar, timeAgo } from './ui';
import type { FeedPost } from './Composer';

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; username: string; avatarUrl: string | null };
};

export default function PostCard({ post: initial }: { post: FeedPost }) {
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

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
      </div>

      {post.caption && <p className="px-4 pb-3 text-sm leading-6 text-slate-700">{post.caption}</p>}
      {post.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrl} alt="" className="h-80 w-full object-cover" />
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
