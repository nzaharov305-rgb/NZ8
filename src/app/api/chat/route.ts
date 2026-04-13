import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamChat, generateTitle } from "@/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const chatSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(10000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { conversationId, content } = parsed.data;

  // Verify ownership
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Save user message
  await prisma.message.create({
    data: { conversationId, role: "user", content },
  });

  // Build message history for AI
  const history = [
    ...conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content },
  ];

  // Auto-generate title on first message
  if (conversation.messages.length === 0) {
    generateTitle(content)
      .then((title) =>
        prisma.conversation.update({
          where: { id: conversationId },
          data: { title },
        })
      )
      .catch(console.error);
  }

  // Stream response
  const stream = await streamChat(history, conversation.model);

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        fullText += text;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      });

      stream.on("finalMessage", async (msg) => {
        const inputTokens = msg.usage?.input_tokens ?? 0;
        const outputTokens = msg.usage?.output_tokens ?? 0;

        await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: fullText,
            tokens: inputTokens + outputTokens,
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        controller.error(err);
      });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
