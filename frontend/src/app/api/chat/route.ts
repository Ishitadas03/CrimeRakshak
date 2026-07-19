// Server-side proxy: bridges the frontend chat UI to the FastAPI /chat backend.
//
// Because the current login UI is a prototype (no real token), this route logs
// in to the backend server-side with service credentials, caches the JWT, and
// forwards the user's message to POST /api/v1/chat. The real Gemini agent,
// DuckDB crime data, citations and Kannada support all live in that backend.
//
// Optional: if the Next.js app needs to override the local FastAPI URL
//   BACKEND_URL=http://127.0.0.1:8001
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8001";
const BACKEND_USERNAME = process.env.BACKEND_USERNAME ?? "admin";
const BACKEND_PASSWORD = process.env.BACKEND_PASSWORD ?? "ChangeMe123!";

// Simple in-memory token cache (per server process).
let cachedToken: { value: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const body = new URLSearchParams({
    username: BACKEND_USERNAME,
    password: BACKEND_PASSWORD,
  });
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`backend login failed: ${res.status}`);
  }
  const data = await res.json();
  // Access tokens are short-lived; cache ~25 min to be safe.
  cachedToken = { value: data.access_token, expires: Date.now() + 25 * 60_000 };
  return cachedToken.value;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversation_id, language } = await req.json();
    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/api/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversation_id ?? null,
        language: language ?? "en",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { error: `backend error ${res.status}`, detail: text },
        { status: 502 },
      );
    }
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: "proxy failure", detail: String(err) },
      { status: 500 },
    );
  }
}
