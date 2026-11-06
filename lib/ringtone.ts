// Tiny Web Audio ringtones for calls — no audio files needed.
// Ringback: what the caller hears while waiting (2s ring, 4s pause).
// Incoming: what the receiver hears (shorter double-cadence ring).

let ctx: AudioContext | null = null;
let stopCurrent: (() => void) | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playPattern(onMs: number, offMs: number): () => void {
  const ac = getCtx();
  if (!ac) return () => {};
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const ringOnce = () => {
    if (stopped) return;
    const t0 = ac.currentTime + 0.01;
    const dur = onMs / 1000;
    for (const freq of [440, 480]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
      gain.gain.setValueAtTime(0.2, t0 + Math.max(0.06, dur - 0.05));
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }
    timer = setTimeout(() => {
      if (!stopped) ringOnce();
    }, onMs + offMs);
  };
  ringOnce();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export function startRingback() {
  stopRing();
  stopCurrent = playPattern(2000, 4000);
}

export function startIncomingRing() {
  stopRing();
  stopCurrent = playPattern(900, 900);
}

export function stopRing() {
  if (stopCurrent) {
    try {
      stopCurrent();
    } catch {
      /* ignore */
    }
    stopCurrent = null;
  }
}

// Call this synchronously inside a tap/click handler before any async work:
// browsers only let a page make sound shortly after a user gesture, so this
// unlocks the AudioContext while the gesture is still "fresh".
export function warmUpAudio() {
  getCtx();
}
