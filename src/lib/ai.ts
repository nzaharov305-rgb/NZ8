import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function streamChat(
  messages: ChatMessage[],
  model: string = "claude-sonnet-4-6"
) {
  return anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system:
      "You are NZ8, a helpful AI assistant. Be concise, clear, and helpful.",
    messages,
  });
}

export async function generateTitle(firstUserMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 30,
    messages: [
      {
        role: "user",
        content: `Generate a very short title (max 5 words) for a chat that starts with: "${firstUserMessage.slice(0, 200)}". Reply with only the title, no punctuation.`,
      },
    ],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "New Chat";
}
