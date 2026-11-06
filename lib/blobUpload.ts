'use client';

import { upload } from '@vercel/blob/client';

// Uploads a file directly from the browser to Blob storage, bypassing the
// serverless function body limit. Returns the public URL.
// onProgress (optional) receives { loaded, total, percentage } as the upload runs.
export async function uploadFile(
  file: File,
  onProgress?: (p: { loaded: number; total: number; percentage: number }) => void,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'upload';
  const blob = await upload(`media/${Date.now()}-${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    ...(onProgress ? { onUploadProgress: onProgress } : {}),
  });
  return blob.url;
}
