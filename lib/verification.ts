import { createHash, randomInt, timingSafeEqual } from 'crypto';

export const VERIFY_CODE_TTL_MS = 15 * 60 * 1000;
export const VERIFY_MAX_ATTEMPTS = 5;
export const VERIFY_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashVerificationCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function codesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
