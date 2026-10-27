'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PostCard from '@/components/PostCard';
import { Avatar } from '@/components/ui';
import type { FeedPost } from '@/components/Composer';

type Profile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  counts: { followers: number; following: number; posts: number };
  relationship: 'self' | 'friends' | 'outgoing' | 'incoming' | 'none';
  incomingRequestId: string | null;
};

export default function ProfilePage({ params }: { params: { username: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/users/${params.username}`);
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (!res.ok) {
      setError('That profile does not exist.');
      return;
    }
    const data = await res.json();
    setProfile(data.profile);
    setPosts(data.posts);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.username]);

  async function addFriend() {
    if (!profile) return;
    setBusy(true);
    const res = await fetch('/api/friend-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: profile.id }),
    });
    setBusy(false);
    if (res.ok) setProfile({ ...profile, relationship: 'outgoing' });
  }

  async function respond(requestId: string, action: 'accept' | 'decline') {
    if (!profile) return;
    setBusy(true);
    const res = await fetch(`/api/friend-requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (res.ok) {
      setProfile({
        ...profile,
        relationship: action === 'accept' ? 'friends' : 'none',
        incomingRequestId: null,
      });
    }
  }

  async function unfriend() {
    if (!profile) return;
    setBusy(true);
    const res = await fetch(`/api/users/${profile.username}/friend`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) setProfile({ ...profile, relationship: 'none' });
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <p className="font-semibold">{error}</p>
          <Link href="/" className="mt-4 inline-block font-semibold text-brand-500">
            Back to feed
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading profile…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.webp" alt="DROP SPOT" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-bold">DROP SPOT</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-brand-500">
            Back to feed
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size="lg" />
              <div>
                <h1 className="text-xl font-bold">{profile.name}</h1>
                <p className="text-sm text-slate-500">@{profile.username}</p>
                {profile.bio && <p className="mt-1 text-sm text-slate-700">{profile.bio}</p>}
              </div>
            </div>
            {profile.relationship === 'self' && (
              <Link
                href="/settings"
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
              >
                Edit profile
              </Link>
            )}
            {profile.relationship === 'none' && (
              <button
                onClick={addFriend}
                disabled={busy}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Add friend
              </button>
            )}
            {profile.relationship === 'outgoing' && (
              <span className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-600">
                Request sent
              </span>
            )}
            {profile.relationship === 'incoming' && profile.incomingRequestId && (
              <div className="flex gap-2">
                <button
                  onClick={() => respond(profile.incomingRequestId as string, 'accept')}
                  disabled={busy}
                  className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => respond(profile.incomingRequestId as string, 'decline')}
                  disabled={busy}
                  className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
            {profile.relationship === 'friends' && (
              <button
                onClick={unfriend}
                disabled={busy}
                className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                Friends ✓
              </button>
            )}
            {profile.relationship !== 'self' && (
              <Link
                href={`/messages/${profile.username}`}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white"
              >
                Message
              </Link>
            )}
          </div>
          <div className="mt-4 flex gap-6 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{profile.counts.posts}</strong> posts
            </span>
            <span>
              <strong className="text-slate-900">{profile.counts.followers}</strong> followers
            </span>
            <span>
              <strong className="text-slate-900">{profile.counts.following}</strong> following
            </span>
          </div>
        </div>

        {posts.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
            <p className="font-semibold">No posts yet</p>
            <p className="mt-1 text-sm text-slate-500">This person has not dropped anything.</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}
