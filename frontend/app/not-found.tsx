'use client';

import { useRouter } from 'next/navigation';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#F5F5F5] px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <FileQuestion size={28} className="text-gray-400" />
        </div>
        <h1 className="text-[22px] font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-[13px] text-gray-500">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/assignments')}
          className="mt-5 px-5 py-2.5 bg-[#1A1A1A] text-white text-[13px] font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors"
        >
          Back to Assignments
        </button>
      </div>
    </div>
  );
}
