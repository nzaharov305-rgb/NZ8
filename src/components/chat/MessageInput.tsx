"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message NZ8…"
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "placeholder:text-gray-400 disabled:opacity-50",
            "max-h-[200px] overflow-y-auto"
          )}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            value.trim() && !disabled
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        NZ8 can make mistakes. Verify important information.
      </p>
    </div>
  );
}
