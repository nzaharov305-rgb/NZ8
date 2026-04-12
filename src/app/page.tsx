import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageSquare, Zap, Shield, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-brand-600">NZ8</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 py-24">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          AI chat that actually{" "}
          <span className="text-brand-600">understands you</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          NZ8 is powered by Anthropic&apos;s Claude — the most capable AI assistant for
          writing, coding, analysis, and more.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors"
        >
          Start chatting free <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: MessageSquare,
            title: "Unlimited conversations",
            description: "Keep your entire chat history organized and searchable.",
          },
          {
            icon: Zap,
            title: "Streaming responses",
            description: "Real-time AI responses with zero perceptible latency.",
          },
          {
            icon: Shield,
            title: "Private & secure",
            description: "Your conversations are encrypted and never shared.",
          },
        ].map(({ icon: Icon, title, description }) => (
          <div key={title} className="p-6 border border-gray-100 rounded-2xl hover:border-brand-200 transition-colors">
            <Icon className="w-8 h-8 text-brand-500 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
