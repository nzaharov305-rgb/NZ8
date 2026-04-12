import Link from "next/link";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { signOut } from "@/lib/auth";

interface Props {
  user: { name?: string | null; email?: string | null };
}

export function Sidebar({ user }: Props) {
  return (
    <aside className="w-64 flex flex-col border-r border-gray-100 bg-white h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="text-xl font-bold text-brand-600">
          NZ8
        </Link>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 border-b border-gray-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
      </nav>

      {/* Conversations */}
      <div className="flex-1 overflow-hidden py-3">
        <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Chats
        </p>
        <ConversationSidebar />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </form>
        <div className="px-3 pt-1">
          <p className="text-xs font-medium text-gray-700 truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
