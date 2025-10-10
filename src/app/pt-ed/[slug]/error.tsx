"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Patient education page error:", error);
  }, [error]);

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Unable to Load Content
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't load this patient education content. This might be due
              to a temporary issue.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={reset}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div />
    </ErrorBoundary>
  );
}
