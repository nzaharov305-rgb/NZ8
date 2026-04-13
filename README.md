# NZ8 — AI Chat SaaS

A full-stack AI chat application powered by Anthropic Claude.

## Stack

- **Next.js 14** (App Router)
- **PostgreSQL** + **Prisma**
- **NextAuth v5** (credentials)
- **Anthropic Claude** (streaming)
- **Tailwind CSS**

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/nzaharov305-rgb/NZ8
cd NZ8
npm install

# 2. Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY

# 3. Setup database
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for NextAuth (run `openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` | API key from [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. https://nz8.vercel.app) |

## Demo credentials

After seeding: `demo@nz8.app` / `password123`
