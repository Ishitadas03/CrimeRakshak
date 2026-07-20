// Server-side proxy for PDF export: authenticates to the FastAPI backend and
// streams back the generated conversation-transcript PDF.
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8001";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { userId, getToken: getClerkToken } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  try {
    const token = await getClerkToken();
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
