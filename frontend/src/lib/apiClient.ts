const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

let cachedToken: string | null = null;

async function performLogin() {
  try {
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

async function getToken() {
  if (typeof window !== "undefined" && (window as any).Clerk?.session) {
    try {
      const clerkToken = await (window as any).Clerk.session.getToken();
      if (clerkToken) return clerkToken;
    } catch (error) {
      console.warn("Failed to get Clerk token:", error);
    }
  }

  if (cachedToken) return cachedToken;
  if (typeof window !== "undefined") {
    cachedToken = localStorage.getItem("auth_token");
    if (cachedToken) return cachedToken;
  }
  return performLogin();
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  let token = await getToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Clear invalid token
    cachedToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    
    // Attempt re-login
    token = await performLogin();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

