'use client';

import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import { Sparkles } from 'lucide-react';

export default function ToolkitPage() {
  return (
    <div className="flex flex-col flex-1 pb-16 lg:pb-0">
      <div className="hidden lg:block"><Header title="AI Teacher's Toolkit" /></div>
      <MobileHeader title="AI Teacher's Toolkit" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Sparkles size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">AI Teacher's Toolkit coming soon</p>
        </div>
      </main>
    </div>
  );
}
