'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, X } from 'lucide-react';
import VedaAILogo from '@/components/ui/Logo';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

const notifications = [
  { id: 1, text: 'Question paper generated successfully', time: '2 min ago', read: false },
  { id: 2, text: 'Assignment is ready to view', time: '1 hour ago', read: false },
  { id: 3, text: 'Welcome to VedaAI!', time: '1 day ago', read: true },
];

export default function MobileHeader({ title, showBack = false, backHref = '/assignments' }: MobileHeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2">
        {showBack ? (
          <button onClick={() => router.push(backHref)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
        ) : (
          <VedaAILogo size={28} />
        )}
        {title && <span className="text-sm font-semibold text-gray-900 ml-1">{title}</span>}
        {!title && !showBack && <span className="text-base font-bold text-gray-900">VedaAI</span>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(p => !p)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 z-50 w-72 bg-white rounded-xl shadow-lg border border-gray-100 animate-scale-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
                <button onClick={() => setShowNotifications(false)}>
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
              {notifs.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 flex gap-3 ${!n.read ? 'bg-orange-50/50' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-orange-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-[12px] text-gray-800">{n.text}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center ml-1">
          <span className="text-[11px] font-bold text-white">JD</span>
        </button>
      </div>
    </header>
  );
}