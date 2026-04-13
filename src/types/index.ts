export type Plan = "FREE" | "PRO" | "ENTERPRISE";

export type MessageRole = "user" | "assistant" | "system";

export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface MessageType {
  id: string;
  role: MessageRole;
  content: string;
  tokens: number | null;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: MessageType[];
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  plan: Plan;
  createdAt: string;
}
