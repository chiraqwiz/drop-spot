'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, Video, VideoOff } from 'lucide-react';

type BroadcastClient = {
  addVideoInputDevice: (s: MediaStream, name: string, pos: { index: number }) => Promise<void>;
  addAudioInputDevice: (s: MediaStream, name: string) => Promise<void>;
  attachPreview: (el: HTMLCanvasElement) => void;
  startBroadcast: (key: string) => Promise<unknown>;
  stopBroadcast: () => void;
  delete: () => void;
};

export default function StudioPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clientRef = useRef<BroadcastClient | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'live' | 'error' | 'ended'>('loading');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Only the broadcaster may open the studio.
      const detail = await fetch(`/api/live/${params.id}`);
      if (detail.status === 401) {
        router.replace('/login');
        return;
      }
      const d = await detail.json().catch(() => ({}));
      if (!detail.ok || !d.stream?.isMine) {
        router.replace(`/live/${params.id}`);
        return;
      }
      if (d.stream.status === 'ENDED') {
        setPhase('ended');
        return;
      }

      const credRes = await fetch(`/api/live/${params.id}/credentials`);
      const creds = await credRes.json().catch(() => ({}));
      if (!credRes.ok) {
        setError(creds.error || 'Could not get stream credentials.');
        setPhase('error');
        return;
      }

      const { default: IVSBroadcastClient } = await import('amazon-ivs-web-broadcast');
      if (cancelled) return;
      if (!IVSBroadcastClient.isSupported()) {
        setError('Live broadcasting is not supported in this browser.');
        setPhase('error');
        return;
      }

      let media: MediaStream;
      try {
        media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        setError('Camera and microphone access is needed to go live. Please allow access and reload.');
        setPhase('error');
        return;
      }
      if (cancelled) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaRef.current = media;

      const client: BroadcastClient = IVSBroadcastClient.create({
        streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
        ingestEndpoint: creds.ingestEndpoint,
      });
      clientRef.current = client;
      try {
        await client.addVideoInputDevice(media, 'camera', { index: 0 });
        await client.addAudioInputDevice(media, 'mic');
      } catch (e) {
        console.error(e);
        setError('Could not set up the camera. Please reload and try again.');
        setPhase('error');
        return;
      }
      if (canvasRef.current) client.attachPreview(canvasRef.current);

      // If the page reloaded mid-stream, resume broadcasting silently.
      if (d.stream.status === 'LIVE') {
        try {
          await client.startBroadcast(creds.streamKey);
          if (!cancelled) setPhase('live');
        } catch (e) {
          console.error(e);
          setError('Could not resume the broadcast. Please try again.');
          setPhase('error');
        }
      } else if (!cancelled) {
        setPhase('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  useEffect(() => {
    if (phase !== 'live') return;
    const t0 = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    return () => {
      try {
        clientRef.current?.stopBroadcast();
      } catch {
        // ignore
      }
      mediaRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startBroadcast() {
    setError('');
    const credRes = await fetch(`/api/live/${params.id}/credentials`);
    const creds = await credRes.json().catch(() => ({}));
    if (!credRes.ok) {
      setError(creds.error || 'Could not get stream credentials.');
      return;
    }
    try {
      await clientRef.current?.startBroadcast(creds.streamKey);
    } catch (e) {
      console.error(e);
      setError('Could not start broadcasting. Check your connection and try again.');
      return;
    }
    const goRes = await fetch(`/api/live/${params.id}/go-live`, { method: 'POST' });
    if (!goRes.ok) {
      try {
        clientRef.current?.stopBroadcast();
      } catch {
        // ignore
      }
      setError('Could not go live. Please try again.');
      return;
    }
    setPhase('live');
  }

  async function endStream() {
    setEnding(true);
    try {
      clientRef.current?.stopBroadcast();
    } catch {
      // ignore
    }
    await fetch(`/api/live/${params.id}/end`, { method: 'POST' });
    router.push('/live');
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Link href="/live" className="text-sm font-semibold text-brand-400">
            ← Live
          </Link>
          <h1 className="flex flex-1 items-center gap-2 text-lg font-bold">
            <Radio className="h-5 w-5 text-red-500" /> Studio
          </h1>
          {phase === 'live' && (
            <span className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE {mm}:{ss}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="overflow-hidden rounded-2xl bg-black">
          <canvas ref={canvasRef} className="aspect-video w-full" />
        </div>

        {phase === 'loading' && (
          <p className="mt-4 text-center text-sm text-slate-400">Setting up your camera…</p>
        )}

        {phase === 'error' && (
          <div className="mt-4 rounded-2xl bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <Link
              href="/live"
              className="mt-3 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold"
            >
              Back to Live
            </Link>
          </div>
        )}

        {phase === 'ended' && (
          <p className="mt-4 text-center text-sm text-slate-400">This stream has ended.</p>
        )}

        {phase === 'ready' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Preview looks good? You are about to broadcast to everyone on DROP SPOT.
            </p>
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            <button
              onClick={startBroadcast}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-bold"
            >
              <Video className="h-5 w-5" /> Start Broadcast
            </button>
          </div>
        )}

        {phase === 'live' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">You are live! Viewers can find you on the Live page.</p>
            <button
              onClick={endStream}
              disabled={ending}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-red-600 disabled:opacity-50"
            >
              <VideoOff className="h-5 w-5" /> {ending ? 'Ending…' : 'End Stream'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
