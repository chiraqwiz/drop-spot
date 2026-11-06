'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui';
import PhotoCropper, { type AspectOption } from '@/components/PhotoCropper';
import { uploadFile } from '@/lib/blobUpload';
import { dobToInputValue } from '@/lib/dob';
import { getPushState, pushSupported, subscribeForPush, unsubscribeFromPush, type PushState } from '@/lib/pushClient';

const BANNER_ASPECTS: AspectOption[] = [
  { label: '3:1', value: 3 },
  { label: 'Original', value: 'original' },
  { label: '16:9', value: 16 / 9 },
  { label: '4:1', value: 4 },
];

function PushSettingsRow() {
  const [state, setState] = useState<PushState>('off');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setState('unsupported');
      return;
    }
    getPushState().then(setState);
  }, []);

  async function enable() {
    setBusy(true);
    await subscribeForPush().catch(() => false);
    setBusy(false);
    setState(await getPushState().catch(() => 'off' as PushState));
  }

  async function disable() {
    setBusy(true);
    await unsubscribeFromPush();
    setBusy(false);
    setState(await getPushState().catch(() => 'off' as PushState));
  }

  if (state === 'unsupported') {
    return <p className="mt-3 text-sm text-slate-500">This browser does not support notifications.</p>;
  }
  if (state === 'blocked') {
    return (
      <p className="mt-3 text-sm text-slate-500">
        Notifications are blocked for DROP SPOT in your browser settings. Re-enable them there to
        get call alerts.
      </p>
    );
  }
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-700">
        {state === 'on' ? 'Notifications are on' : 'Notifications are off'}
      </p>
      {state === 'on' ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Turn off'}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Enabling…' : 'Turn on'}
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);
  const [bannerCropFile, setBannerCropFile] = useState<File | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setName(data.user.name);
      setUsername(data.user.username);
      setBio(data.user.bio ?? '');
      setDob(dobToInputValue(data.user.dob));
      setAvatarUrl(data.user.avatarUrl ?? null);
      setBannerUrl(data.user.bannerUrl ?? null);
      setLoading(false);
    })();
  }, [router]);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError('');
    setCropFile(f);
    setCropSrc(URL.createObjectURL(f));
  }

  function pickBannerFile(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller.');
      return;
    }
    setError('');
    setBannerCropFile(f);
    setBannerCropSrc(URL.createObjectURL(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);

    let nextAvatarUrl: string | undefined;
    if (removePhoto) {
      nextAvatarUrl = '';
    } else if (file) {
      try {
        nextAvatarUrl = await uploadFile(file);
      } catch {
        setError('Photo upload failed.');
        setBusy(false);
        return;
      }
    }

    let nextBannerUrl: string | undefined;
    if (removeBanner) {
      nextBannerUrl = '';
    } else if (bannerFile) {
      try {
        nextBannerUrl = await uploadFile(bannerFile);
      } catch {
        setError('Banner upload failed.');
        setBusy(false);
        return;
      }
    }

    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username,
        bio,
        dob: dob || undefined,
        ...(nextAvatarUrl !== undefined ? { avatarUrl: nextAvatarUrl } : {}),
        ...(nextBannerUrl !== undefined ? { bannerUrl: nextBannerUrl } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not save your profile.');
      return;
    }
    setAvatarUrl(data.user.avatarUrl ?? null);
    setPreview(null);
    setFile(null);
    setRemovePhoto(false);
    setBannerUrl(data.user.bannerUrl ?? null);
    setBannerPreview(null);
    setBannerFile(null);
    setRemoveBanner(false);
    setUsername(data.user.username);
    setDob(dobToInputValue(data.user.dob));
    setSaved(true);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading settings…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {cropSrc && cropFile && (
        <PhotoCropper
          imageSrc={cropSrc}
          originalFile={cropFile}
          aspects={[{ label: 'Square', value: 1 }]}
          cropShape="round"
          title="Crop profile photo"
          onClose={() => {
            setCropSrc(null);
            setCropFile(null);
          }}
          onDone={(cropped) => {
            setFile(cropped);
            setRemovePhoto(false);
            setPreview(URL.createObjectURL(cropped));
            setCropSrc(null);
            setCropFile(null);
          }}
        />
      )}
      {bannerCropSrc && bannerCropFile && (
        <PhotoCropper
          imageSrc={bannerCropSrc}
          originalFile={bannerCropFile}
          aspects={BANNER_ASPECTS}
          title="Crop banner"
          onClose={() => {
            setBannerCropSrc(null);
            setBannerCropFile(null);
          }}
          onDone={(cropped) => {
            setBannerFile(cropped);
            setRemoveBanner(false);
            setBannerPreview(URL.createObjectURL(cropped));
            setBannerCropSrc(null);
            setBannerCropFile(null);
          }}
        />
      )}
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
        <div className="rounded-2xl bg-white p-6 shadow-soft">
          <h1 className="text-xl font-bold">Edit profile</h1>
          <p className="mt-1 text-sm text-slate-500">This is what people see when they visit your profile.</p>

          <form onSubmit={save} className="mt-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={name || '?'} avatarUrl={preview ?? avatarUrl} size="lg" />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Change photo
                </button>
                {avatarUrl && !removePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemovePhoto(true);
                      setFile(null);
                      setPreview(null);
                    }}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Remove photo
                  </button>
                )}
                {removePhoto && (
                  <button
                    type="button"
                    onClick={() => setRemovePhoto(false)}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Keep photo
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
            {removePhoto && <p className="text-sm text-slate-500">Your photo will be removed when you save.</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Profile banner</label>
              {(bannerPreview ?? bannerUrl) && !removeBanner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerPreview ?? bannerUrl ?? ''}
                  alt="Banner preview"
                  className="mb-3 h-32 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mb-3 flex h-32 w-full items-center justify-center rounded-2xl bg-slate-200 text-sm text-slate-500">
                  No banner yet
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {bannerUrl || bannerPreview ? 'Change banner' : 'Add banner'}
                </button>
                {bannerUrl && !removeBanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveBanner(true);
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Remove banner
                  </button>
                )}
                {removeBanner && (
                  <button
                    type="button"
                    onClick={() => setRemoveBanner(false)}
                    className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Keep banner
                  </button>
                )}
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickBannerFile(e.target.files?.[0])}
              />
              {removeBanner && <p className="mt-1 text-sm text-slate-500">Your banner will be removed when you save.</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">Letters, numbers and underscores, 3–30 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="A little about you…"
                className="w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-slate-500">Shown on your profile.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Profile saved.</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Save changes'}
              </button>
              <Link href={`/profile/${username}`} className="text-sm font-semibold text-brand-500">
                View profile
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-base font-bold">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Get notified about video calls even when DROP SPOT is closed.
          </p>
          <PushSettingsRow />
        </div>
      </div>
    </main>
  );
}
