export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export async function apiFetch(path, { token, ...init } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const resp = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await resp.json().catch(() => ({})) : await resp.text().catch(() => '');

  if (!resp.ok) {
    const message = (data && data.message) || (data && data.error) || `HTTP ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}
