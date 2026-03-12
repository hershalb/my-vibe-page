import { NextRequest, NextResponse } from "next/server";
import { saveFeedback, listFeedback } from "@/lib/feedback-store";

export async function POST(request: NextRequest) {
  const { message, name, pageId } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const item = await saveFeedback({
    message: message.trim(),
    name: typeof name === "string" && name.trim() ? name.trim() : undefined,
    pageId: typeof pageId === "string" && pageId.trim() ? pageId.trim() : undefined,
  });

  return NextResponse.json({ success: true, id: item.id });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  const result = await listFeedback(cursor, limit);

  return NextResponse.json(result);
}
