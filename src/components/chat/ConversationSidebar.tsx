"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn, truncate } from "@/lib/utils";
import type { ConversationSummary } from "@/types";

export function ConversationSidebar() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then(setConversations);
  }, [pathname]);

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <Link
        href="/chat"
        className="flex items-center gap-2 mx-3 mb-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Plus className="w-4 h-4" /> New chat
      </Link>

      <div className="flex-1 overflow-y-auto space-y-0.5 px-3">
        {conversations.map((c) => {
          const isActive = pathname === `/chat/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm group transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{truncate(c.title, 28)}</span>
              </span>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
