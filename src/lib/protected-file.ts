import { apiRequest } from '@/services/auth.service';
import { ENV } from '@/config/env';

function buildFileUrl(filePath: string): string {
  const normalized = filePath.replace(/^\/+/, '');
  return `${ENV.API_BASE_URL}/${normalized}`;
}

export async function openProtectedFile(filePath: string, fileName?: string): Promise<void> {
  const res = await apiRequest(buildFileUrl(filePath), {
    method: 'GET',
  });

  if (!res.ok) {
    let message = 'Gagal membuka dokumen';
    try {
      const json = await res.json();
      message = json?.message || message;
    } catch {
      // ignore JSON parse errors for binary responses
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const isInline = blob.type === 'application/pdf' || blob.type.startsWith('image/');
  if (isInline) {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || 'document';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
}
