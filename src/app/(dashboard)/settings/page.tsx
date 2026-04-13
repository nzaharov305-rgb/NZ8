import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { User, CreditCard, MessageSquare } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { _count: { select: { conversations: true } } },
  });

  if (!user) return null;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4" /> Profile
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{user.name ?? "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member since</span>
                <span className="font-medium">{formatDate(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CreditCard className="w-4 h-4" /> Plan
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Current plan</span>
                <Badge variant={user.plan === "FREE" ? "secondary" : "default"}>
                  {user.plan}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="w-4 h-4" /> Usage
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total conversations</span>
                <span className="font-medium">{user._count.conversations}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
