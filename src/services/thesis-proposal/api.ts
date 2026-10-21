import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  details?: { path: string; message: string }[];
}

/** Reads the JSON envelope; a validation error shows its first field message. */
export async function parse<T>(response: Response, fallback: string): Promise<Envelope<T>> {
  const body = (await response.json().catch(() => ({}))) as Partial<Envelope<T>>;
  if (!response.ok) {
    throw new Error(body.details?.[0]?.message || body.message || fallback);
  }
  return body as Envelope<T>;
}

export async function getJson<T>(path: string, fallback: string): Promise<T> {
  return (await parse<T>(await apiRequest(getApiUrl(path)), fallback)).data;
}

export async function send<T>(method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body: unknown, fallback: string) {
  const response = await apiRequest(getApiUrl(path), {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return parse<T>(response, fallback);
}
