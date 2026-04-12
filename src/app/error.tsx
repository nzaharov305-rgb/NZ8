"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
