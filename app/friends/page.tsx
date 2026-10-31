'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui';

type Friend = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
};

export default function FriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/friends');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      setFriends((await res.json()).friends);
      setLoading(false);
    })();
  }, [router]);

  async function unfriend(username: string) {
    if (!window.confirm(`Remove @${username} as a friend?`)) return;
    const res = await fetch(`/api/users/${username}/friend`, { method: 'DELETE' });
    if (res.ok) setFriends((f) => f.filter((x) => x.username !== username));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading friends…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.webp" alt="DROP SPOT" className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-bold">DROP SPOT</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-brand-500">
            Back to feed
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold">
          Friends <span className="text-base font-medium text-slate-500">({friends.length})</span>
        </h1>

        {friends.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
            <p className="font-semibold">No friends yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Accept friend requests or add people from the feed, and they will show up here.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft">
              <Link href={`/profile/${f.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={f.name} avatarUrl={f.avatarUrl} size="lg" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold hover:underline">{f.name}</span>
                  <span className="block truncate text-sm text-slate-500">@{f.username}</span>
                  {f.bio && <span className="mt-0.5 block truncate text-sm text-slate-600">{f.bio}</span>}
                </span>
              </Link>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/messages/${f.username}`}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Message
                </Link>
                <button
                  onClick={() => unfriend(f.username)}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Unfriend
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
