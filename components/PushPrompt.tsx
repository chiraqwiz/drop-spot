'use client';

import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { pushSupported, subscribeForPush } from '@/lib/pushClient';

// One-time nudge so calls (and other alerts) can reach the user
// with the app closed. Dismissible; never shown again once enabled.
// A permanent toggle also lives in Settings.
export default function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    if (window.localStorage.getItem('ds-push-prompt-dismissed')) return;
    if (Notification.permission === 'default') setVisible(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem('ds-push-prompt-dismissed', '1');
    setVisible(false);
  }

  async function enable() {
    setBusy(true);
    const ok = await subscribeForPush().catch(() => false);
    setBusy(false);
    if (ok) setVisible(false);
    // If permission was denied, the card stays so they can retry or dismiss.
  }

  if (!visible) return null;

  return (
    <div className="mb-3 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <BellRing className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">Never miss a call</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          Turn on notifications and DROP SPOT will ring you for video calls even with the app
          closed.
        </p>
        <button
          onClick={enable}
          disabled={busy}
          className="mt-2 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Enabling…' : 'Turn on notifications'}
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-slate-400"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
