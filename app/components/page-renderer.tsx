"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import ChatWidget from "./chat-widget";
import Toast from "./toast";
import { validateHtmlResponse, stripMarkdownFences } from "@/lib/validate-html";
import { parseFullHtml, parseBodyAttributes } from "@/lib/parse-html";
import { applyDiff, validateDiffResult } from "@/lib/apply-diff";
import type { DiffChange } from "@/lib/apply-diff";

interface PageMessage {
  role: "user" | "assistant";
  content: string;
}

interface PageRendererProps {
  pageId: string;
  initialHtml: string;
  initialMessages: PageMessage[];
  isViewOnly?: boolean;
}

function getOwnedPages(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("vibe-owned-pages") || "{}");
  } catch {
    return {};
  }
}

function markPageOwned(pageId: string) {
  const owned = getOwnedPages();
  owned[pageId] = true;
  localStorage.setItem("vibe-owned-pages", JSON.stringify(owned));
}

function isPageOwner(pageId: string): boolean {
  return getOwnedPages()[pageId] === true;
}

const VIBE_HEAD_ATTR = "data-vibe-injected";

export default function PageRenderer({
  pageId,
  initialHtml,
  initialMessages,
  isViewOnly: forceViewOnly = false,
}: PageRendererProps) {
  const [currentHtml, setCurrentHtml] = useState(initialHtml);
  const [messages, setMessages] = useState<PageMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [tailwindReady, setTailwindReady] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const previousHtmlRef = useRef(initialHtml);
  const streamBufferRef = useRef("");
  const tailwindLoadedRef = useRef(false);

  useEffect(() => {
    const isNew = initialMessages.length === 0 && !isPageOwner(pageId);
    if (isNew) {
      markPageOwned(pageId);
    }
    setIsOwner(isPageOwner(pageId));
  }, [pageId, initialMessages.length]);

  const showChat = !forceViewOnly && isOwner;

  const clearInjectedHead = useCallback(() => {
    document
      .querySelectorAll(`[${VIBE_HEAD_ATTR}]`)
      .forEach((el) => el.remove());
  }, []);

  const ensureTailwind = useCallback(() => {
    if (tailwindLoadedRef.current) return;

    if (!(window as unknown as Record<string, unknown>).__vibeTwWarnPatched) {
      const origWarn = console.warn;
      console.warn = function (...args: unknown[]) {
        if (
          typeof args[0] === "string" &&
          args[0].includes("cdn.tailwindcss.com")
        )
          return;
        origWarn.apply(console, args);
      };
      (window as unknown as Record<string, unknown>).__vibeTwWarnPatched = true;
    }

    const existing = document.querySelector('script[src*="tailwindcss"]');
    if (existing) {
      tailwindLoadedRef.current = true;
      setTailwindReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    script.setAttribute(VIBE_HEAD_ATTR, "tailwind");
    script.onload = () => setTailwindReady(true);
    document.head.appendChild(script);
    tailwindLoadedRef.current = true;
  }, []);

  const injectHeadContent = useCallback(
    (headHtml: string) => {
      clearInjectedHead();
      ensureTailwind();

      const temp = document.createElement("div");
      temp.innerHTML = headHtml;

      Array.from(temp.children).forEach((child) => {
        if (
          child.tagName === "SCRIPT" &&
          (child as HTMLScriptElement).src?.includes("tailwindcss")
        ) {
          return;
        }
        if (child.tagName === "META") return;

        const clone = child.cloneNode(true) as HTMLElement;
        clone.setAttribute(VIBE_HEAD_ATTR, "true");

        if (clone.tagName === "SCRIPT") {
          const newScript = document.createElement("script");
          Array.from(clone.attributes).forEach((attr) =>
            newScript.setAttribute(attr.name, attr.value)
          );
          newScript.textContent = clone.textContent;
          document.head.appendChild(newScript);
        } else {
          document.head.appendChild(clone);
        }
      });
    },
    [clearInjectedHead, ensureTailwind]
  );

  const injectHtml = useCallback(
    (html: string) => {
      if (!containerRef.current) return;

      const chatEl = containerRef.current.querySelector("#vibe-chat");
      const hadFocus = chatEl?.contains(document.activeElement);

      const parsed = parseFullHtml(html);

      injectHeadContent(parsed.headContent);

      const bodyAttrs = parseBodyAttributes(parsed.bodyAttributes);
      if (bodyAttrs.class) {
        containerRef.current.className = bodyAttrs.class;
      }
      if (bodyAttrs.style) {
        containerRef.current.style.cssText =
          containerRef.current.style.cssText + ";" + bodyAttrs.style;
      }

      containerRef.current.innerHTML = parsed.bodyContent;

      const scripts = containerRef.current.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        if (oldScript.src?.includes("tailwindcss")) return;
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      const newTarget = containerRef.current.querySelector(
        "#vibe-chat"
      ) as HTMLElement | null;
      setPortalTarget(newTarget);

      if (hadFocus && newTarget) {
        requestAnimationFrame(() => {
          const focusable =
            newTarget.querySelector("textarea") ||
            newTarget.querySelector("input");
          focusable?.focus();
        });
      }
    },
    [injectHeadContent]
  );

  useEffect(() => {
    injectHtml(currentHtml);
    return () => clearInjectedHead();
  }, []);

  const savePage = useCallback(
    (html: string, msgs: PageMessage[]) => {
      fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageId, html, messages: msgs }),
      }).catch(() => {});
    },
    [pageId]
  );

  const handleDiffResponse = useCallback(
    (data: { changes: DiffChange[] }, newMessages: PageMessage[]) => {
      setStreamText("Applying changes\u2026");

      const { html: patchedHtml, applied, failed } = applyDiff(currentHtml, data.changes);

      if (applied === 0) {
        setToastMessage("Couldn't apply the changes. Try rephrasing your request.");
        injectHtml(previousHtmlRef.current);
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Something went wrong \u2014 try rephrasing!" },
        ]);
        return;
      }

      const diffValidation = validateDiffResult(patchedHtml);
      if (!diffValidation.valid) {
        setToastMessage(diffValidation.error || "Diff broke critical page elements.");
        injectHtml(previousHtmlRef.current);
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Something went wrong \u2014 try rephrasing!" },
        ]);
        return;
      }

      if (failed.length > 0) {
        console.warn("Some diff operations failed:", failed);
      }

      injectHtml(patchedHtml);
      setCurrentHtml(patchedHtml);
      setMessages(newMessages);
      savePage(patchedHtml, newMessages);
    },
    [currentHtml, injectHtml, savePage]
  );

  const handleStreamResponse = useCallback(
    async (response: Response, newMessages: PageMessage[]) => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let lastUpdate = 0;
      const DEBOUNCE_MS = 200;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBufferRef.current += decoder.decode(value, { stream: true });

        const now = Date.now();
        if (now - lastUpdate >= DEBOUNCE_MS) {
          lastUpdate = now;
          setStreamText(streamBufferRef.current);
        }
      }

      const finalHtml = stripMarkdownFences(streamBufferRef.current);
      const validation = validateHtmlResponse(finalHtml);

      if (!validation.valid) {
        setToastMessage(
          `Hmm, that didn't work. ${validation.error || "Try rephrasing your request."}`
        );
        injectHtml(previousHtmlRef.current);
        setMessages([
          ...newMessages,
          { role: "assistant", content: "Something went wrong \u2014 try rephrasing!" },
        ]);
      } else {
        injectHtml(finalHtml);
        setCurrentHtml(finalHtml);
        setMessages(newMessages);
        savePage(finalHtml, newMessages);
      }
    },
    [injectHtml, savePage]
  );

  const handleSend = useCallback(
    async (userMessage: string) => {
      if (isStreaming) return;

      const newMessages: PageMessage[] = [
        ...messages,
        { role: "user", content: userMessage },
      ];
      setMessages(newMessages);
      setIsStreaming(true);
      previousHtmlRef.current = currentHtml;
      streamBufferRef.current = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId,
            currentHtml,
            message: userMessage,
            history: messages,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const data = await response.json();
          handleDiffResponse(data, newMessages);
        } else {
          await handleStreamResponse(response, newMessages);
        }
      } catch (err) {
        console.error("Chat error:", err);
        setToastMessage("Something went wrong. Please try again.");
        injectHtml(previousHtmlRef.current);
      } finally {
        setStreamText("");
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, currentHtml, pageId, injectHtml, handleDiffResponse, handleStreamResponse]
  );

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/p/${pageId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  }, [pageId]);

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          overflow: "auto",
        }}
      />

      {showChat &&
        portalTarget &&
        createPortal(
          <ChatWidget
            onSend={handleSend}
            isStreaming={isStreaming}
            streamText={streamText}
          />,
          portalTarget
        )}

      {showChat && (
        <button
          onClick={handleShare}
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            color: "#2dd4bf",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
            zIndex: 99998,
            transition: "transform 0.15s, box-shadow 0.15s, background 0.15s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.05)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 16px rgba(45, 212, 191, 0.15)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 12px rgba(0,0,0,0.2)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.06)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {shareToast ? "Copied!" : "Share"}
        </button>
      )}

      {feedbackOpen && !feedbackSent && (
        <div
          style={{
            position: "fixed",
            bottom: "52px",
            left: "16px",
            width: "280px",
            padding: "16px",
            borderRadius: "14px",
            background: "rgba(10,14,26,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 99998,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: "flex",
            flexDirection: "column" as const,
            gap: "10px",
          }}
        >
          <input
            type="text"
            placeholder="Name (optional)"
            value={feedbackName}
            onChange={(e) => setFeedbackName(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <textarea
            placeholder="What's on your mind?"
            value={feedbackMsg}
            onChange={(e) => setFeedbackMsg(e.target.value)}
            rows={3}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.06)",
              color: "#e2e8f0",
              fontSize: "13px",
              fontFamily: "inherit",
              outline: "none",
              resize: "none" as const,
            }}
          />
          <button
            disabled={!feedbackMsg.trim() || feedbackSending}
            onClick={async () => {
              setFeedbackSending(true);
              try {
                await fetch("/api/feedback", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: feedbackMsg.trim(),
                    name: feedbackName.trim() || undefined,
                    pageId,
                  }),
                });
                setFeedbackSent(true);
                setTimeout(() => {
                  setFeedbackOpen(false);
                  setFeedbackSent(false);
                  setFeedbackMsg("");
                  setFeedbackName("");
                }, 2000);
              } catch {
                setToastMessage("Could not send feedback. Try again.");
              } finally {
                setFeedbackSending(false);
              }
            }}
            style={{
              padding: "8px",
              borderRadius: "8px",
              border: "none",
              background:
                !feedbackMsg.trim() || feedbackSending
                  ? "rgba(255,255,255,0.06)"
                  : "linear-gradient(135deg, #0d9488, #2dd4bf)",
              color:
                !feedbackMsg.trim() || feedbackSending
                  ? "#475569"
                  : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor:
                !feedbackMsg.trim() || feedbackSending
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {feedbackSending ? "Sending..." : "Send feedback"}
          </button>
        </div>
      )}

      {feedbackOpen && feedbackSent && (
        <div
          style={{
            position: "fixed",
            bottom: "52px",
            left: "16px",
            padding: "16px 20px",
            borderRadius: "14px",
            background: "rgba(10,14,26,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 99998,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: "#2dd4bf",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Thanks for your feedback!
        </div>
      )}

      <button
        onClick={() => setFeedbackOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          padding: "6px 14px",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          zIndex: 99998,
          opacity: 0.7,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
        }}
      >
        {feedbackOpen ? "Close" : "Feedback"}
      </button>

      {!showChat && (
        <a
          href="/"
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            padding: "6px 14px",
            borderRadius: "16px",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 500,
            textDecoration: "none",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            zIndex: 99998,
            opacity: 0.7,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
          }}
        >
          Made with vibe page
        </a>
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          background: "linear-gradient(145deg, #0a0e1a 0%, #111936 40%, #0f172a 70%, #0a0e1a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          transition: "opacity 0.4s ease",
          opacity: tailwindReady ? 0 : 1,
          pointerEvents: tailwindReady ? "none" : "auto",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
@keyframes vibeLoadPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}`,
          }}
        />
        <span
          style={{
            fontSize: "24px",
            fontWeight: 600,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: "linear-gradient(to right, #5eead4, #2dd4bf, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "vibeLoadPulse 2s ease-in-out infinite",
          }}
        >
          vibe page
        </span>
      </div>
    </>
  );
}
