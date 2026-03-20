'use client';

import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import { BookOpen } from 'lucide-react';

export default function LibraryPage() {
  return (
    <div className="flex flex-col flex-1 pb-16 lg:pb-0">
      <div className="hidden lg:block"><Header title="My Library" /></div>
      <MobileHeader title="My Library" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">My Library coming soon</p>
        </div>
      </main>
    </div>
  );
}
