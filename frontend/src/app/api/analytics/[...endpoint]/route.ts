// Server-side proxy: bridges the frontend analytics UI to the FastAPI /analytics backend.
//
// Automatically acquires & caches a backend Bearer token and forwards any GET/POST
// queries to live DuckDB telemetry endpoints over the KSP dataset.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8001";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { userId, getToken: getClerkToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const path = params.endpoint.join("/");
    const searchParams = req.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/api/v1/analytics/${path}${
      searchParams ? `?${searchParams}` : ""
    }`;

    const token = await getClerkToken();
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `backend error ${res.status}`, detail: text },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "analytics proxy failure", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { userId, getToken: getClerkToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const path = params.endpoint.join("/");
    const targetUrl = `${BACKEND_URL}/api/v1/analytics/${path}`;
    const body = await req.json();

    const token = await getClerkToken();
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `backend error ${res.status}`, detail: text },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "analytics proxy POST failure", detail: String(err) },
      { status: 500 }
    );
  }
}
