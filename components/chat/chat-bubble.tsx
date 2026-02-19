"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PandaSymbol } from "@/components/shared/panda-symbol";

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: {
      type: "fetch",
      url: "/api/chat",
    },
  });

  const isLoading = status === "streaming";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="size-7">
                <PandaSymbol />
              </div>
              <span className="text-sm font-medium">Panda</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
            style={{ height: 400 }}
          >
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <div className="size-12">
                  <PandaSymbol />
                </div>
                <p className="text-sm text-muted-foreground">
                  Hey! I&apos;m Panda. Ask me anything about SPFarms.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <span key={i}>{part.text}</span>;
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              )}
          </div>

          {/* Input */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-border px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-full bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[#FAF0E3] shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        <div className="size-9">
          <PandaSymbol />
        </div>
      </button>
    </>
  );
}
