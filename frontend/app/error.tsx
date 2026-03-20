'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#F5F5F5] flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-[18px] font-bold text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-[13px] text-gray-500 max-w-xs">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            className="mt-5 px-5 py-2.5 bg-[#1A1A1A] text-white text-[13px] font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
