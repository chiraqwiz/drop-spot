'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Avatar, timeAgo } from './ui';
import PhotoCropper from './PhotoCropper';
import { POST_ASPECTS, type FeedPost } from './Composer';

type Comment = {
  id: string;
  body: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  user: { id: string; name: string; username: string; avatarUrl: string | null };
};

const COMMENT_EMOJIS = [
  '😂', '❤️', '👍', '🔥', '👏', '😮', '😢', '🙏',
  '💯', '🎉', '😍', '🤣', '😎', '🥺', '👀', '💪',
  '🙌', '😴', '🤔', '😱', '👋', '✨', '💔', '😭',
];

// Custom image emojis: tapping one inserts its shortcode; rendered as an image.
const CUSTOM_EMOJIS = [
  { code: ':smilecry:', img: '/emojis/smile-cry.jpg', label: 'Smile now, cry later' },
];

function renderCommentBody(body: string) {
  const codes = CUSTOM_EMOJIS.map((c) => c.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (codes.length === 0) return body;
  const parts = body.split(new RegExp(`(${codes.join('|')})`, 'g'));
  return parts.map((part, i) => {
    const custom = CUSTOM_EMOJIS.find((c) => c.code === part);
    if (custom) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={custom.img}
          alt={custom.label}
          title={custom.label}
          className="inline h-6 w-6 rounded align-[-4px]"
        />
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function PostCard({ post: initial, meId }: { post: FeedPost; meId?: string }) {
  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentMediaKind, setCommentMediaKind] = useState<'image' | 'video' | null>(null);
  const [commentPreview, setCommentPreview] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [busy, setBusy] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const isMine = !!meId && meId === post.user.id;
  const [editing, setEditing] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editMediaKind, setEditMediaKind] = useState<'image' | 'video' | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editCropSrc, setEditCropSrc] = useState<string | null>(null);
  const [editCropFile, setEditCropFile] = useState<File | null>(null);
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

  function pickCommentFile(f: File | undefined) {
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isImage && !isVideo) return;
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (f.size > maxBytes) return;
    setCommentFile(f);
    setCommentMediaKind(isVideo ? 'video' : 'image');
    setCommentPreview(URL.createObjectURL(f));
  }

  function insertEmoji(e: string) {
    const el = commentInputRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + e + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + e.length, start + e.length);
    });
  }

  async function addComment() {
    if (!draft.trim() && !commentFile) return;
    setBusy(true);

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;
    if (commentFile) {
      const form = new FormData();
      form.append('file', commentFile);
      const up = await fetch('/api/upload', { method: 'POST', body: form });
      const upData = await up.json().catch(() => ({}));
      if (!up.ok) {
        setBusy(false);
        return;
      }
      mediaUrl = upData.url;
      mediaType = commentMediaKind ?? 'image';
    }

    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: draft.trim() || undefined,
        mediaUrl,
        ...(mediaUrl ? { mediaType } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return;
    setComments((c) => [...(c ?? []), data.comment]);
    setPost((p) => ({ ...p, commentsCount: p.commentsCount + 1 }));
    setDraft('');
    setCommentFile(null);
    setCommentMediaKind(null);
    setCommentPreview(null);
    setShowEmoji(false);
  }

  function startEdit() {
    setEditCaption(post.caption ?? '');
    setEditMediaUrl(post.mediaUrl ?? '');
    setEditMediaKind(post.mediaType === 'video' ? 'video' : post.mediaUrl ? 'image' : null);
    setEditFile(null);
    setEditPreview(null);
    setEditError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditFile(null);
    setEditMediaKind(null);
    setEditPreview(null);
    setEditError('');
  }

  function pickEdit(f: File | undefined) {
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isImage && !isVideo) {
      setEditError('Please choose a photo or video file.');
      return;
    }
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (f.size > maxBytes) {
      setEditError(isVideo ? 'Video must be 50MB or smaller.' : 'Image must be 5MB or smaller.');
      return;
    }
    setEditError('');
    if (isVideo) {
      setEditFile(f);
      setEditMediaKind('video');
      setEditPreview(URL.createObjectURL(f));
      return;
    }
    setEditMediaKind('image');
    setEditCropFile(f);
    setEditCropSrc(URL.createObjectURL(f));
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
      body: JSON.stringify({
        caption: editCaption.trim(),
        mediaUrl: finalMediaUrl,
        ...(finalMediaUrl ? { mediaType: editMediaKind ?? 'image' } : {}),
      }),
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
      {editCropSrc && editCropFile && (
        <PhotoCropper
          imageSrc={editCropSrc}
          originalFile={editCropFile}
          aspects={POST_ASPECTS}
          title="Crop photo"
          onClose={() => {
            setEditCropSrc(null);
            setEditCropFile(null);
          }}
          onDone={(cropped) => {
            setEditFile(cropped);
            setEditMediaKind('image');
            setEditPreview(URL.createObjectURL(cropped));
            setEditCropSrc(null);
            setEditCropFile(null);
          }}
        />
      )}
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
          {(editPreview || editMediaUrl) &&
            (editMediaKind === 'video' ? (
              <video
                src={editPreview ?? editMediaUrl}
                controls
                playsInline
                preload="metadata"
                className="h-64 w-full rounded-2xl bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={editPreview ?? editMediaUrl} alt="" className="h-64 w-full rounded-2xl object-cover" />
            ))}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => editInputRef.current?.click()}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {editFile || editMediaUrl ? 'Change photo/video' : 'Add a photo/video'}
            </button>
            {(editFile || editMediaUrl) && (
              <button
                type="button"
                onClick={() => {
                  setEditFile(null);
                  setEditMediaKind(null);
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
              accept="image/*,video/*"
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
          {post.mediaUrl &&
            (post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-96 w-full bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.mediaUrl} alt="" className="h-80 w-full object-cover" />
            ))}
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
                <div className="max-w-[85%] rounded-2xl bg-slate-100 px-3 py-2 text-sm">
                  <p className="font-semibold">{c.user.name}</p>
                  {c.body && <p className="text-slate-700">{renderCommentBody(c.body)}</p>}
                  {c.mediaUrl &&
                    (c.mediaType === 'video' ? (
                      <video
                        src={c.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="mt-1 max-h-48 rounded-xl bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.mediaUrl} alt="" className="mt-1 max-h-48 rounded-xl object-cover" />
                    ))}
                </div>
              </div>
            ))}
            {comments !== null && comments.length === 0 && (
              <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
            )}
          </div>
          <div className="mt-3">
            {commentPreview && (
              <div className="relative mb-2 inline-block">
                {commentMediaKind === 'video' ? (
                  <video src={commentPreview} className="max-h-24 rounded-xl bg-black" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={commentPreview} alt="" className="max-h-24 rounded-xl object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCommentFile(null);
                    setCommentMediaKind(null);
                    setCommentPreview(null);
                  }}
                  className="absolute -right-2 -top-2 rounded-full bg-slate-800 px-1.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={commentInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addComment()}
                placeholder="Write a comment…"
                className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => commentFileRef.current?.click()}
                title="Add a photo or video"
                className="rounded-full bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
              >
                📷
              </button>
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                title="Add emoji"
                className="rounded-full bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
              >
                😊
              </button>
              <button
                onClick={addComment}
                disabled={busy || (!draft.trim() && !commentFile)}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <input
              ref={commentFileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => pickCommentFile(e.target.files?.[0])}
            />
            {showEmoji && (
              <div className="mt-2 flex flex-wrap gap-1 rounded-2xl bg-slate-50 p-2">
                {COMMENT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => insertEmoji(e)}
                    className="rounded-lg px-1 py-0.5 text-xl hover:bg-slate-200"
                  >
                    {e}
                  </button>
                ))}
                {CUSTOM_EMOJIS.map((ce) => (
                  <button
                    key={ce.code}
                    type="button"
                    onClick={() => insertEmoji(ce.code)}
                    title={ce.label}
                    className="rounded-lg p-0.5 hover:bg-slate-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ce.img} alt={ce.label} className="h-8 w-8 rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
