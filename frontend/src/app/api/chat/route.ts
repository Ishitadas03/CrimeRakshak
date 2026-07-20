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

export async function POST(req: Request) {
  try {
    const { userId, getToken: getClerkToken } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversation_id, language } = await req.json();
    if (!message || typeof message !== "string") {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const token = await getClerkToken();
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
