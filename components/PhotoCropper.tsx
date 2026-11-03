'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

export type AspectOption = { label: string; value: number | 'original' };

const MAX_EDGE = 2048;

async function getCroppedBlob(imageSrc: string, pixels: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not load image'));
    i.src = imageSrc;
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(pixels.width, pixels.height));
  const w = Math.max(1, Math.round(pixels.width * scale));
  const h = Math.max(1, Math.round(pixels.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) throw new Error('Could not crop image');
  return blob;
}

export default function PhotoCropper({
  imageSrc,
  originalFile,
  aspects,
  cropShape = 'rect',
  title = 'Crop photo',
  onClose,
  onDone,
}: {
  imageSrc: string;
  originalFile: File;
  aspects: AspectOption[];
  cropShape?: 'rect' | 'round';
  title?: string;
  onClose: () => void;
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [naturalAspect, setNaturalAspect] = useState(1);
  const [picked, setPicked] = useState<AspectOption>(aspects[0]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const aspect = picked.value === 'original' ? naturalAspect : picked.value;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function useCropped() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError('');
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const name = originalFile.name.replace(/\.[a-z0-9]+$/i, '') || 'photo';
      onDone(new File([blob], `${name}-cropped.jpg`, { type: 'image/jpeg' }));
    } catch {
      setError('Could not crop this photo. Try another one.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white text-slate-900">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="relative h-[50vh] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onMediaLoaded={(m) => setNaturalAspect(m.naturalWidth / m.naturalHeight)}
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          {aspects.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {aspects.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setPicked(a)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    picked.label === a.label
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-brand-500"
              aria-label="Zoom"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDone(originalFile)}
              disabled={busy}
              className="flex-1 rounded-full bg-slate-200 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Use original
            </button>
            <button
              type="button"
              onClick={useCropped}
              disabled={busy}
              className="flex-1 rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Cropping…' : 'Crop & use photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
