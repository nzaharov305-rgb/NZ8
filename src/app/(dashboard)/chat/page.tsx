"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/conversations", { method: "POST" })
      .then((r) => r.json())
      .then((conv) => router.replace(`/chat/${conv.id}`));
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}
