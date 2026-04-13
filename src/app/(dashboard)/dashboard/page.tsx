import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  const conversations = await prisma.conversation.findMany({
    where: { userId: session!.user!.id },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session!.user!.name ?? "there"}
            </h1>
            <p className="text-gray-500 mt-1">Your recent conversations</p>
          </div>
          <Link
            href="/chat"
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New chat
          </Link>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Start a new chat to get going</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-brand-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-brand-600">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c._count.messages} messages &middot; {formatDate(c.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
