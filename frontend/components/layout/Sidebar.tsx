'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, FileText, Sparkles, BookOpen, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import VedaAILogo from '@/components/ui/Logo';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useProfileStore } from '@/store/profileStore';

const navItems = [
  { label: 'Home', icon: Home, href: '/', showCount: false },
  { label: 'My Groups', icon: Users, href: '/groups', showCount: false },
  { label: 'Assignments', icon: FileText, href: '/assignments', showCount: true },
  { label: "AI Teacher's Toolkit", icon: Sparkles, href: '/toolkit', showCount: false },
  { label: 'My Library', icon: BookOpen, href: '/library', showCount: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const assignments = useAssignmentStore((s) => s.assignments);
  const { name, school, city } = useProfileStore();
  const count = assignments.length;

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => {
    if (href === '/assignments') {
      return pathname === '/assignments' || pathname.startsWith('/assignments/');
    }
    return pathname === href;
  };

  return (
    <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <VedaAILogo size={32} />
        <span className="text-[17px] font-bold text-gray-900 tracking-tight">VedaAI</span>
      </div>

      {/* Create Assignment Button */}
      <div className="px-4 pt-5 pb-4">
        <button
          onClick={() => router.push('/assignments/create')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} strokeWidth={2.5} />
          Create Assignment
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                size={17}
                className={active ? 'text-gray-900' : 'text-gray-500'}
                strokeWidth={active ? 2 : 1.75}
              />
              <span className="flex-1">{item.label}</span>
              {item.showCount && count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full min-w-[18px] text-center leading-tight">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100">
        <div className="px-3 py-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Settings size={17} strokeWidth={1.75} className="text-gray-500" />
            Settings
          </Link>
        </div>

        {/* School profile card */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-bold text-white">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{school}</p>
              <p className="text-[11px] text-gray-500 truncate">{city}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}