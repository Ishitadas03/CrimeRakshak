const API_BASE = "http://localhost:8000/api/v1";

let cachedToken: string | null = null;

async function getToken() {
  if (cachedToken) return cachedToken;
  if (typeof window !== "undefined") {
    cachedToken = localStorage.getItem("auth_token");
    if (cachedToken) return cachedToken;
  }

  try {
    // Auto-login as admin for the dashboard integration
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: "admin",
        password: "ChangeMe123!",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      cachedToken = data.access_token;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", cachedToken as string);
      }
      return cachedToken;
    }
  } catch (error) {
    console.error("Failed to auto-login:", error);
  }
  return null;
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
