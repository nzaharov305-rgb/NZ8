import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Star,
  Code2,
  FileText,
  Lightbulb,
  ChevronDown,
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-extrabold text-brand-600 tracking-tight">NZ8</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="bg-brand-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <Star className="w-3.5 h-3.5" /> Powered by Anthropic Claude
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
          Your personal AI assistant
          <br />
          <span className="text-brand-600">that actually gets it</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Write, code, analyse, brainstorm — NZ8 uses Claude, the world&apos;s most
          capable AI, to supercharge everything you do.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-base font-semibold hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required &middot; Free forever plan</p>

        {/* Mock chat preview */}
        <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left max-w-2xl mx-auto shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">You</div>
            <div className="bg-brand-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tl-sm">
              Write a product description for noise-cancelling headphones
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-600 font-extrabold text-xs">N8</span>
            </div>
            <div className="bg-white border border-gray-100 text-sm px-4 py-3 rounded-2xl rounded-tl-sm text-gray-700 leading-relaxed">
              <strong>Silence the world. Hear what matters.</strong><br />
              Immerse yourself in pure sound with our ProSound X1 headphones. Featuring
              industry-leading 40dB active noise cancellation, 30-hour battery life, and
              premium comfort — perfect for work, travel, or just your own world.
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-500 text-lg">One AI assistant for all your tasks</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Natural conversations",
                description:
                  "Chat naturally and get answers that understand context. NZ8 remembers your entire conversation.",
              },
              {
                icon: Zap,
                title: "Real-time streaming",
                description:
                  "Responses appear instantly, word by word. No waiting — just a fluid, fast experience.",
              },
              {
                icon: Shield,
                title: "Private & secure",
                description:
                  "Your data stays yours. Conversations are encrypted and never used for training.",
              },
              {
                icon: Code2,
                title: "Coding assistant",
                description:
                  "Debug code, write functions, explain errors, review pull requests — in any language.",
              },
              {
                icon: FileText,
                title: "Writing & editing",
                description:
                  "Emails, essays, product copy, social posts — polished content in seconds.",
              },
              {
                icon: Lightbulb,
                title: "Ideas & analysis",
                description:
                  "Brainstorm, analyse data, summarise documents, build business plans.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                description: "Perfect for trying out NZ8",
                features: ["20 messages per day", "Chat history", "Basic support"],
                cta: "Get started",
                href: "/register",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$15",
                period: "per month",
                description: "For power users and professionals",
                features: [
                  "Unlimited messages",
                  "Full chat history",
                  "Priority support",
                  "Latest Claude models",
                  "Export conversations",
                ],
                cta: "Start Pro",
                href: "/register",
                highlight: true,
              },
              {
                name: "Enterprise",
                price: "$99",
                period: "per month",
                description: "For teams and businesses",
                features: [
                  "Everything in Pro",
                  "Team workspace",
                  "API access",
                  "Custom branding",
                  "SLA & dedicated support",
                ],
                cta: "Contact us",
                href: "/register",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? "bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-200"
                    : "bg-white border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Most popular
                  </div>
                )}
                <h3
                  className={`text-lg font-bold mb-1 ${
                    plan.highlight ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-brand-100" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlight ? "text-brand-100" : "text-gray-400"}`}>
                    /{plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 ${
                          plan.highlight ? "text-white" : "text-brand-500"
                        }`}
                      />
                      <span className={plan.highlight ? "text-brand-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-white text-brand-600 hover:bg-brand-50"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "What is NZ8?",
                a: "NZ8 is an AI chat assistant powered by Anthropic's Claude. It helps you write, code, analyse, and brainstorm — all in one place.",
              },
              {
                q: "Is my data private?",
                a: "Yes. Your conversations are stored securely in our database and are never shared with third parties or used to train AI models.",
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel at any time. Your Pro access continues until the end of the billing period.",
              },
              {
                q: "What AI model does NZ8 use?",
                a: "NZ8 uses Claude by Anthropic — one of the most capable and safest AI models available today.",
              },
              {
                q: "Is there a free plan?",
                a: "Yes! The Free plan gives you 20 messages per day with no credit card required.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group bg-white border border-gray-100 rounded-2xl p-6 cursor-pointer"
              >
                <summary className="flex items-center justify-between font-medium text-gray-900 list-none">
                  {q}
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to work smarter?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Join thousands of people using NZ8 every day.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-extrabold text-brand-600">NZ8</span>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} NZ8. Powered by Anthropic Claude.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-gray-600 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
