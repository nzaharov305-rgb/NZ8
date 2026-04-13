"use client";

import { useEffect, useRef } from "react";
import type { Message } from "./ChatInterface";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface Props {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">How can I help you today?</p>
          <p className="text-sm mt-1">Ask me anything — I\'m powered by Claude.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const isAssistant = msg.role === "assistant";
        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl mx-auto animate-fade-in",
              !isAssistant && "flex-row-reverse"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isAssistant
                  ? "bg-brand-100 text-brand-600"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {isAssistant ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap",
                isAssistant
                  ? "bg-white border border-gray-100 text-gray-900"
                  : "bg-brand-600 text-white",
                isAssistant && isLast && isStreaming && msg.content && "streaming"
              )}
            >
              {msg.content || (
                <span className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot"
                      style={{ animationDelay: `${j * 0.16}s` }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
