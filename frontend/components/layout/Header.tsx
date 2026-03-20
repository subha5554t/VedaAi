'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, ArrowLeft, LayoutGrid, X, Settings, LogOut, User, Check } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useProfileStore } from '@/store/profileStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const { name, email, school, city, setProfile } = useProfileStore();
  const [form, setForm] = useState({ name, email, school, city });
  const [saved, setSaved] = useState(false);

  const initials = form.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    setProfile(form);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[15px] font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col items-center pt-5 pb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-2">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <p className="text-[11px] text-gray-400">Profile picture auto-generated from name</p>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              School Name
            </label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              City
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-[13px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 text-[13px] font-medium text-white bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Header({
  title = 'Assignment',
  showBack = false,
  backHref = '/assignments',
}: HeaderProps) {
  const router = useRouter();
  const assignments = useAssignmentStore((s) => s.assignments);
  const { name, email } = useProfileStore();

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([
    {
      id: 1,
      text: 'Welcome to VedaAI! Start by creating your first assignment.',
      time: 'Just now',
      read: false,
    },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const prevAssignmentsRef = useRef(assignments);

  // Auto-notify when assignment completes
  useEffect(() => {
    const prev = prevAssignmentsRef.current;
    assignments.forEach((a) => {
      const prevA = prev.find((p) => p._id === a._id);
      if (prevA && prevA.status !== 'completed' && a.status === 'completed') {
        setNotifs((prev) => [
          {
            id: Date.now(),
            text: `✅ "${a.title}" question paper is ready to view!`,
            time: 'Just now',
            read: false,
          },
          ...prev,
        ]);
      }
    });
    prevAssignmentsRef.current = assignments;
  }, [assignments]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center justify-between px-5 h-14 flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.push(backHref)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-gray-400" />
            <span className="text-sm text-gray-700 font-medium">{title}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setShowProfile(false);
              }}
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
              <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-100 animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-[13px] font-semibold text-gray-900">
                    Notifications{' '}
                    {unreadCount > 0 && (
                      <span className="text-orange-500">({unreadCount})</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-orange-500 hover:text-orange-600 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[12px] text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-gray-50 last:border-0 flex gap-3 items-start ${
                          !n.read ? 'bg-orange-50/60' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            !n.read ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-gray-800 leading-snug">{n.text}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() =>
                              setNotifs((prev) =>
                                prev.map((x) =>
                                  x.id === n.id ? { ...x, read: true } : x
                                )
                              )
                            }
                            className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded"
                          >
                            <Check size={12} className="text-gray-400" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfile((p) => !p);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white">{initials}</span>
              </div>
              <span className="text-sm text-gray-700 font-medium hidden sm:block">{name}</span>
              <ChevronDown
                size={14}
                className={`text-gray-500 hidden sm:block transition-transform duration-200 ${
                  showProfile ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-11 z-50 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 animate-scale-in">
                <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-white">{initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{name}</p>
                      <p className="text-[11px] text-gray-500">{email}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    setShowProfileModal(true);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <User size={14} className="text-gray-400" /> Edit Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    router.push('/settings');
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={14} className="text-gray-400" /> Settings
                </button>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </>
  );
}