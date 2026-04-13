import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session!.user!.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) notFound();

  return (
    <ChatInterface
      conversationId={conversation.id}
      initialMessages={conversation.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
