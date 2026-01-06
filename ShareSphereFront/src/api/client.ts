const API_BASE_URL = import. meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined');
}

// ⭐ ERWEITERT:  Unterstützt jetzt GET, POST, PUT, DELETE mit options
export async function apiFetch<T>(
  path: string, 
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options?. headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response. json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}