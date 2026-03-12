"use client";

import { useState, useEffect, useCallback } from "react";

interface FeedbackItem {
  id: string;
  message: string;
  name?: string;
  pageId?: string;
  createdAt: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeedback = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", "20");

    const res = await fetch(`/api/feedback?${params}`);
    const data = await res.json();
    return data as { items: FeedbackItem[]; nextCursor: string | null };
  }, []);

  useEffect(() => {
    fetchFeedback().then((data) => {
      setItems(data.items);
      setNextCursor(data.nextCursor);
      setLoading(false);
    });
  }, [fetchFeedback]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchFeedback(nextCursor);
    setItems((prev) => [...prev, ...data.items]);
    setNextCursor(data.nextCursor);
    setLoadingMore(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(145deg, #0a0e1a 0%, #111936 40%, #0f172a 70%, #0a0e1a 100%)",
        fontFamily: FONT_STACK,
        color: "#e2e8f0",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            marginBottom: "8px",
            background: "linear-gradient(to right, #5eead4, #2dd4bf)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Feedback
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "32px",
          }}
        >
          {loading
            ? "Loading..."
            : `${items.length}${nextCursor ? "+" : ""} submissions`}
        </p>

        {!loading && items.length === 0 && (
          <p style={{ color: "#475569", fontSize: "15px" }}>
            No feedback yet.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.message}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "12px",
                  color: "#64748b",
                  flexWrap: "wrap",
                }}
              >
                {item.name && <span>{item.name}</span>}
                <span>{formatDate(item.createdAt)}</span>
                {item.pageId && (
                  <a
                    href={`/p/${item.pageId}`}
                    style={{ color: "#2dd4bf", textDecoration: "none" }}
                  >
                    page: {item.pageId}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              display: "block",
              margin: "24px auto 0",
              padding: "10px 24px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "#2dd4bf",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loadingMore ? "not-allowed" : "pointer",
              fontFamily: FONT_STACK,
              opacity: loadingMore ? 0.5 : 1,
            }}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
