'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PhoneOff } from 'lucide-react';
import { startRingback, stopRing } from '@/lib/ringtone';

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

type Invite = {
  id: string;
  roomId: string;
  status: string;
  isCaller: boolean;
  peer: { name: string; username: string };
};

export default function CallPage({ params }: { params: { roomId: string } }) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [meName, setMeName] = useState('');
  const [error, setError] = useState('');
  const [left, setLeft] = useState(false);

  const endCall = useCallback(
    async (inviteId: string) => {
      try {
        await fetch(`/api/calls/${inviteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'end' }),
        });
      } catch {
        /* best effort */
      }
      stopRing();
      try {
        apiRef.current?.dispose();
      } catch {
        /* best effort */
      }
      router.push('/messages');
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const me = await meRes.json();
      const invRes = await fetch(`/api/calls/by-room/${params.roomId}`);
      if (!invRes.ok) {
        setError('This call does not exist or has ended.');
        return;
      }
      const { invite: inv } = await invRes.json();
      if (cancelled) return;
      setInvite(inv);
      setMeName(me.user?.name ?? 'Friend');
      if (inv.isCaller && inv.status === 'PENDING') startRingback();

      // Load the Jitsi Meet API and join the room.
      await new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) return resolve();
        const s = document.createElement('script');
        s.src = 'https://meet.jit.si/external_api.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Could not load video service'));
        document.head.appendChild(s);
      }).catch(() => {
        if (!cancelled) setError('Could not start video. Check your connection and try again.');
      });
      if (cancelled || !mountRef.current || !window.JitsiMeetExternalAPI) return;

      const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: `dropspot_${params.roomId}`,
        parentNode: mountRef.current,
        width: '100%',
        height: '100%',
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
        },
        userInfo: { displayName: me.user?.name ?? 'Friend' },
      });
      apiRef.current = api;
      api.addEventListener('participantJoined', () => {
        stopRing();
      });
      api.addEventListener('videoConferenceLeft', () => {
        if (!cancelled) {
          setLeft(true);
          endCall(inv.id);
        }
      });
    })();
    return () => {
      cancelled = true;
      stopRing();
      try {
        apiRef.current?.dispose();
      } catch {
        /* best effort */
      }
    };
  }, [params.roomId, router, endCall]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-200">
        <p className="font-semibold">{error}</p>
        <Link href="/messages" className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
          Back to messages
        </Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-slate-950 text-white">
      <div ref={mountRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {invite ? `Video call with ${invite.peer.name}` : 'Connecting…'}
          </p>
          <p className="text-xs text-slate-400">DROP SPOT calls</p>
        </div>
        {invite && !left && (
          <button
            onClick={() => endCall(invite.id)}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold"
          >
            <PhoneOff className="h-4 w-4" /> Hang up
          </button>
        )}
      </header>
      {!invite && (
        <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 p-6 text-center text-sm text-slate-400">
          Joining the call…
        </p>
      )}
    </main>
  );
}
