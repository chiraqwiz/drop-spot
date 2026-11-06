'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, Check, Mic } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [granted, setGranted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      setChecking(false);
    })();
  }, [router]);

  async function enableCalls() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      return;
    }
    setRequesting(true);
    setDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setGranted(true);
    } catch {
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-soft">
        <p className="text-3xl">🎉</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Welcome to DROP SPOT!</h1>

        {!granted ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Video calls work best when DROP SPOT can use your camera and microphone. Enable
              them now and you will join calls instantly — no popups later.
            </p>
            <div className="mt-4 flex items-center justify-center gap-6 text-slate-500">
              <span className="flex items-center gap-2 text-sm">
                <Camera className="h-5 w-5" /> Camera
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Mic className="h-5 w-5" /> Microphone
              </span>
            </div>
            {denied && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Permission was blocked. No problem — your browser will ask again when you join
                your first call.
              </p>
            )}
            {unsupported && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This browser cannot access camera or microphone. Calls will ask when you join one.
              </p>
            )}
            <button
              onClick={enableCalls}
              disabled={requesting}
              className="mt-6 w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {requesting ? 'Asking…' : 'Enable camera & mic'}
            </button>
            <Link
              href="/"
              className="mt-3 block text-sm font-semibold text-slate-500"
            >
              Skip for now
            </Link>
          </>
        ) : (
          <>
            <p className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              You are all set for video calls. See you in there!
            </p>
            <Link
              href="/"
              className="mt-6 block w-full rounded-full bg-brand-500 py-3 text-sm font-semibold text-white"
            >
              Enter DROP SPOT
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
