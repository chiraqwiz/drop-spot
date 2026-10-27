import type { MetadataRoute } from 'next';

const ICON_BASE = 'https://traeyw0jxcp61nuu.public.blob.vercel-storage.com/icons';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DROP SPOT',
    short_name: 'DROP SPOT',
    description: 'A Facebook-inspired social app experience',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#1877f2',
    icons: [
      {
        src: `${ICON_BASE}/icon-192.webp`,
        sizes: '192x192',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: `${ICON_BASE}/icon-512.webp`,
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any',
      },
    ],
  };
}
