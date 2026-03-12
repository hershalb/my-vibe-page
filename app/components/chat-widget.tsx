"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PLACEHOLDERS = [
  "make this a neon cyberpunk portfolio",
  "move the chat to the bottom right",
  "add a spinning 3D cube",
  "make confetti rain on click",
  "turn this into a 90s GeoCities page",
  "add a dark mode toggle",
  "make a button that hides this chat",
  "add a starfield background",
  "create a working todo list",
  "make everything comic sans",
];

interface ChatWidgetProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  streamText: string;
}

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontFamily: FONT_STACK,
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#e2e8f0",
  maxWidth: "100%",
  textAlign: "left",
};

const textareaBaseStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 60px 14px 16px",
  borderRadius: "16px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255,255,255,0.1)",
  outline: "none",
  fontSize: "15px",
  lineHeight: "1.5",
  fontFamily: FONT_STACK,
  background: "rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  backdropFilter: "blur(12px)",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  resize: "none" as const,
  display: "block",
  boxSizing: "border-box" as const,
  textAlign: "left" as const,
};

const textareaFocusStyle: React.CSSProperties = {
  ...textareaBaseStyle,
  borderColor: "rgba(45, 212, 191, 0.4)",
  boxShadow: "0 2px 16px rgba(45, 212, 191, 0.12)",
};

const sendBtnBase: React.CSSProperties = {
  position: "absolute",
  bottom: "10px",
  right: "10px",
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #0d9488, #2dd4bf)",
  color: "#ffffff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.15s, transform 0.1s",
  boxShadow: "0 1px 4px rgba(45, 212, 191, 0.3)",
  padding: 0,
};

const sendBtnDisabled: React.CSSProperties = {
  ...sendBtnBase,
  opacity: 0.35,
  cursor: "not-allowed",
};

export default function ChatWidget({
  onSend,
  isStreaming,
  streamText,
}: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const prevStreamingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderOpacity(0);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderOpacity(1);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      setInput("");
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollLeft = tickerRef.current.scrollWidth;
    }
  }, [streamText]);

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
  }, [input, isStreaming, onSend]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submit();
    },
    [submit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  const isDisabled = isStreaming || !input.trim();

  return (
    <div style={containerStyle}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes vibeChatSpin {
  to { transform: rotate(360deg); }
}`,
        }}
      />

      <form onSubmit={handleFormSubmit} style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={isFocused ? textareaFocusStyle : textareaBaseStyle}
          placeholder=""
          disabled={isStreaming}
        />

        {!input && !isFocused && !isStreaming && (
          <span
            style={{
              position: "absolute",
              left: "16px",
              top: "14px",
              right: "60px",
              color: "#64748b",
              pointerEvents: "none",
              transition: "opacity 0.3s ease",
              opacity: placeholderOpacity,
              fontSize: "15px",
              fontFamily: FONT_STACK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "left",
            }}
          >
            {PLACEHOLDERS[placeholderIdx]}
          </span>
        )}

        {isStreaming ? (
          <div
            style={{
              ...sendBtnDisabled,
              cursor: "default",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "vibeChatSpin 0.6s linear infinite",
              }}
            />
          </div>
        ) : (
          <button
            type="submit"
            disabled={isDisabled}
            style={isDisabled ? sendBtnDisabled : sendBtnBase}
            onMouseDown={(e) => {
              if (!isDisabled) {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "scale(0.92)";
              }
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                "scale(1)";
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </form>

      {isStreaming && streamText && (
        <div
          ref={tickerRef}
          style={{
            height: "10px",
            overflowX: "hidden",
            overflowY: "hidden",
            whiteSpace: "nowrap",
            fontSize: "7px",
            lineHeight: "10px",
            fontFamily: "monospace",
            color: "rgba(45, 212, 191, 0.4)",
            direction: "rtl",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          <span style={{ direction: "ltr", unicodeBidi: "bidi-override" }}>
            {streamText}
          </span>
        </div>
      )}
    </div>
  );
}
