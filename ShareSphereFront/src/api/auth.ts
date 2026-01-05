const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;


export async function login(userName: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, password }),
  });

  if (response.status === 401) {
    throw new Error('Invalid username or password');
  }

  if (!response.ok) {
    throw new Error(`Login failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  
  if (! data?. token) {
    throw new Error('No token received from server');
  }

  return data.token;
}

export async function register(userName: string, displayName: string, password: string, email: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userName, displayName, password, email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0] || 'Registration failed');
  }

  const data = await response.json();
  return data.token;
}

// Helper function to make authenticated requests
export async function authFetch<T>(path: string, options:  RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}