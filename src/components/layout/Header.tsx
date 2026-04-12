import Link from "next/link";

interface Props {
  title?: string;
}

export function Header({ title }: Props) {
  return (
    <header className="border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-900 truncate">{title ?? "NZ8"}</h1>
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
        Dashboard
      </Link>
    </header>
  );
}
