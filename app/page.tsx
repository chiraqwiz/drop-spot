'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Bell, Home, MessageSquare, Search, UserCircle2, Users } from 'lucide-react';
import Composer, { type FeedPost } from '@/components/Composer';
import PostCard from '@/components/PostCard';
import Stories, { type StoryGroup } from '@/components/Stories';
import { Avatar } from '@/components/ui';

type Me = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  counts: { followers: number; following: number; posts: number };
};

type SuggestedUser = { id: string; name: string; username: string; avatarUrl: string | null };
type FriendRequest = {
  id: string;
  sender: { id: string; name: string; username: string; avatarUrl: string | null };
};
type Notification = { id: string; type: string; message: string; read: boolean; createdAt: string };

export default function FeedPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [conversations, setConversations] = useState<
    {
      user: { id: string; name: string; username: string; avatarUrl: string | null };
      lastMessage: { body: string; createdAt: string; fromMe: boolean };
      unread: number;
    }[]
  >([]);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setMe(meData.user);
      const [postsRes, reqRes, sugRes, notifRes, storiesRes, msgsRes] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/friend-requests'),
        fetch('/api/users?suggest=1'),
        fetch('/api/notifications'),
        fetch('/api/stories'),
        fetch('/api/messages'),
      ]);
      if (postsRes.ok) {
        const d = await postsRes.json();
        setPosts(d.posts);
        setNextCursor(d.nextCursor);
      }
      if (storiesRes.ok) setStoryGroups((await storiesRes.json()).groups);
      if (msgsRes.ok) {
        const d = await msgsRes.json();
        setConversations(d.conversations.slice(0, 5));
        setTotalUnreadMessages(d.totalUnread);
      }
      if (reqRes.ok) setRequests((await reqRes.json()).requests);
      if (sugRes.ok) setSuggested((await sugRes.json()).users);
      if (notifRes.ok) {
        const d = await notifRes.json();
        setNotifications(d.notifications);
        setUnread(d.unread);
      }
      setLoading(false);
    })();
  }, [router]);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/users?q=${encodeURIComponent(q.trim())}`);
    if (res.ok) setResults((await res.json()).users);
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    const res = await fetch(`/api/posts?cursor=${nextCursor}`);
    if (!res.ok) return;
    const d = await res.json();
    setPosts((p) => [...p, ...d.posts]);
    setNextCursor(d.nextCursor);
  }

  async function actOnRequest(id: string, action: 'accept' | 'decline') {
    const res = await fetch(`/api/friend-requests/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) setRequests((r) => r.filter((x) => x.id !== id));
  }

  async function addFriend(id: string) {
    const res = await fetch('/api/friend-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: id }),
    });
    if (res.ok) setSuggested((s) => s.filter((x) => x.id !== id));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function openNotifications() {
    setShowNotifications((v) => !v);
    if (!showNotifications && unread > 0) {
      await fetch('/api/notifications', { method: 'POST' });
      setUnread(0);
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    }
  }

  if (loading || !me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading DROP SPOT…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-20 text-slate-900 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src="/logo.webp" alt="DROP SPOT" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
            </Link>
            <div className="relative">
              <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500">
                <Search className="mr-2 h-4 w-4" />
                <input
                  aria-label="Search"
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Search DROP SPOT"
                />
              </div>
              {results.length > 0 && (
                <div className="absolute left-0 top-12 w-64 rounded-2xl bg-white p-2 shadow-soft">
                  {results.map((u) => (
                    <Link
                      key={u.id}
                      href={`/profile/${u.username}`}
                      onClick={() => {
                        setResults([]);
                        setQuery('');
                      }}
                      className="flex items-center gap-2 rounded-xl p-2 hover:bg-slate-100"
                    >
                      <Avatar name={u.name} size="sm" />
                      <span className="text-sm font-medium">
                        {u.name} <span className="text-slate-500">@{u.username}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-brand-500">
              <Home className="h-5 w-5" /> Home
            </Link>
            <span className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600">
              <Users className="h-5 w-5" /> Friends
            </span>
            <span className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600">
              <MessageSquare className="h-5 w-5" /> Messages
            </span>
            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" /> Notifications
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl bg-white p-3 shadow-soft">
                  <h3 className="mb-2 font-semibold">Notifications</h3>
                  {notifications.length === 0 && (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  )}
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <p key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        {n.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href={`/profile/${me.username}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <UserCircle2 className="h-5 w-5" /> Profile
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href={`/profile/${me.username}`}>
              <Avatar name={me.name} avatarUrl={me.avatarUrl} />
            </Link>
            <button onClick={logout} className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <Link href={`/profile/${me.username}`} className="mb-4 flex items-center gap-3">
              <Avatar name={me.name} avatarUrl={me.avatarUrl} size="lg" />
              <div>
                <p className="font-semibold hover:underline">{me.name}</p>
                <p className="text-sm text-slate-500">@{me.username}</p>
              </div>
            </Link>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Friends: {me.counts.following}</p>
              <p>Followers: {me.counts.followers}</p>
              <p>Posts: {me.counts.posts}</p>
            </div>
            <Link href="/settings" className="mt-4 inline-block text-sm font-semibold text-brand-500">
              Edit profile
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">Suggested</h3>
            {suggested.length === 0 && (
              <p className="text-sm text-slate-500">No suggestions right now. New people will show up here.</p>
            )}
            <div className="space-y-3">
              {suggested.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-2">
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                    <span className="text-sm font-medium">{u.name}</span>
                  </Link>
                  <button
                    onClick={() => addFriend(u.id)}
                    className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <Stories
            groups={storyGroups}
            meUsername={me.username}
            onRefresh={async () => {
              const res = await fetch('/api/stories');
              if (res.ok) setStoryGroups((await res.json()).groups);
            }}
          />
          <Composer meName={me.name} meAvatarUrl={me.avatarUrl} onPosted={(post) => setPosts((p) => [post, ...p])} />

          {posts.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
              <p className="font-semibold">No posts yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Be the first to drop something, or add friends to fill your feed.
              </p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {nextCursor && (
            <button
              onClick={loadMore}
              className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-slate-600 shadow-soft hover:bg-slate-50"
            >
              Load more
            </button>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">Friend Requests</h3>
            {requests.length === 0 && <p className="text-sm text-slate-500">No pending requests.</p>}
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2">
                  <Link href={`/profile/${r.sender.username}`} className="flex items-center gap-2">
                    <Avatar name={r.sender.name} avatarUrl={r.sender.avatarUrl} size="sm" />
                    <span className="text-sm font-medium">{r.sender.name}</span>
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => actOnRequest(r.id, 'accept')}
                      className="rounded-full bg-brand-500 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => actOnRequest(r.id, 'decline')}
                      className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Messages</h3>
              <Link href="/messages" className="text-sm font-semibold text-brand-500">
                See all
              </Link>
            </div>
            {conversations.length === 0 && (
              <p className="text-sm text-slate-500">No messages yet.</p>
            )}
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link key={c.user.id} href={`/messages/${c.user.username}`} className="flex items-center gap-2">
                  <Avatar name={c.user.name} avatarUrl={c.user.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.user.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {c.lastMessage.fromMe ? 'You: ' : ''}
                      {c.lastMessage.body}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex flex-col items-center gap-1 text-xs font-medium text-brand-500">
          <Home className="h-5 w-5" /> Home
        </Link>
        <Link href="/messages" className="relative flex flex-col items-center gap-1 text-xs font-medium text-slate-600">
          <MessageSquare className="h-5 w-5" /> Messages
          {totalUnreadMessages > 0 && (
            <span className="absolute -top-1 left-6 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {totalUnreadMessages}
            </span>
          )}
        </Link>
        <Link href={`/profile/${me.username}`} className="flex flex-col items-center gap-1 text-xs font-medium text-slate-600">
          <UserCircle2 className="h-5 w-5" /> Profile
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 text-xs font-medium text-slate-600">
          <Users className="h-5 w-5" /> Settings
        </Link>
      </nav>
    </main>
  );
}
