
// Passe die Basis-URL an deinen Controller an (z. B. /api/auth)
const API_BASE =
  import.meta.env.VITE_API_BASE ?? "https://localhost:5001/api/auth";

export async function login(userName: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });

  if (res.status === 401) {
    throw new Error("Benutzername oder Passwort ist falsch.");
  }
  if (!res.ok) {
    throw new Error(`Login fehlgeschlagen (HTTP ${res.status}).`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data?.token) throw new Error("Kein Token vom Server erhalten.");
  return data.token;
}

// Optional: Wrapper for follow-up requests with Bearer token
export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
   const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}


export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}

