'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'My Groups', icon: Users, href: '/groups' },
  { label: 'Library', icon: BookOpen, href: '/library' },
  { label: 'AI Toolkit', icon: Sparkles, href: '/toolkit' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 min-w-0',
                active ? 'text-[#E8520A]' : 'text-gray-500'
              )}
            >
              <item.icon
                size={20}
                strokeWidth={active ? 2 : 1.75}
                className={active ? 'text-[#E8520A]' : 'text-gray-500'}
              />
              <span className={cn('text-[10px] font-medium', active ? 'text-[#E8520A]' : 'text-gray-500')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
