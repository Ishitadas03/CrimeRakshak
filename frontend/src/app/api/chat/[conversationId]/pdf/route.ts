// Server-side proxy for PDF export: authenticates to the FastAPI backend and
// streams back the generated conversation-transcript PDF.
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const BACKEND_USERNAME = process.env.BACKEND_USERNAME ?? "admin";
const BACKEND_PASSWORD = process.env.BACKEND_PASSWORD ?? "ChangeMe123!";

let cachedToken: { value: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 30_000) return cachedToken.value;
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: BACKEND_USERNAME, password: BACKEND_PASSWORD }),
  });
  if (!res.ok) throw new Error(`backend login failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expires: Date.now() + 25 * 60_000 };
  return cachedToken.value;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  try {
    const token = await getToken();
    const res = await fetch(`${BACKEND_URL}/api/v1/chat/${conversationId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: `backend ${res.status}`, detail: text }, { status: 502 });
    }
    const blob = await res.arrayBuffer();
    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="conversation_${conversationId}.pdf"`,
      },
    });
  } catch (err) {
    return Response.json({ error: "proxy failure", detail: String(err) }, { status: 500 });
  }
}
