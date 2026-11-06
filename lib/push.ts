import webpush from 'web-push';
import { prisma } from './prisma';

let ready = false;

function setup() {
  if (ready) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:iamamalemodel4real@gmail.com',
    pub,
    priv,
  );
  ready = true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
};

// Best-effort: never throws. Drops dead subscriptions (410/404).
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  try {
    setup();
    if (!ready) return;
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
        } catch (e: unknown) {
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 410 || code === 404) {
            await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
          }
        }
      }),
    );
  } catch {
    /* push is best-effort */
  }
}
