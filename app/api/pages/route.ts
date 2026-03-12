import { NextRequest, NextResponse } from "next/server";
import { savePage, loadPage } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { id, html, messages } = await request.json();

  if (!id || !html) {
    return NextResponse.json({ error: "Missing id or html" }, { status: 400 });
  }

  const existing = await loadPage(id);

  await savePage({
    id,
    html,
    messages: messages || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const page = await loadPage(id);
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(page);
}
