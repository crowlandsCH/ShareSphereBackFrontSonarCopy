const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}

export async function apiFetch<T>(
  path: string, 
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  // ⭐ NEU: Prüfe ob Response Body vorhanden ist
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // Wenn kein Content oder Content-Length ist 0, gib leeres Objekt zurück
  if (
    contentLength === '0' || 
    ! contentType || 
    !contentType.includes('application/json')
  ) {
    return {} as T;
  }

  // Versuche JSON zu parsen
  const text = await response.text();
  if (! text) {
    return {} as T;
  }

  return JSON.parse(text);
}