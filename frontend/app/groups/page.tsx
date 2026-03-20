'use client';

import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import { Users } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="flex flex-col flex-1 pb-16 lg:pb-0">
      <div className="hidden lg:block"><Header title="My Groups" /></div>
      <MobileHeader title="My Groups" />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">My Groups coming soon</p>
        </div>
      </main>
    </div>
  );
}
