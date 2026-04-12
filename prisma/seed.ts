import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@nz8.app" },
    update: {},
    create: {
      email: "demo@nz8.app",
      name: "Demo User",
      passwordHash,
      plan: "FREE",
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      title: "Welcome to NZ8",
      userId: user.id,
      messages: {
        create: [
          {
            role: "user",
            content: "Hello! What can you help me with?",
          },
          {
            role: "assistant",
            content:
              "Hi! I'm your AI assistant powered by Claude. I can help you with writing, analysis, coding, brainstorming, answering questions, and much more. What would you like to explore today?",
          },
        ],
      },
    },
  });

  console.log(`Created user: ${user.email}`);
  console.log(`Created conversation: ${conversation.title}`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
