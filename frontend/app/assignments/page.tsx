'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Search, SlidersHorizontal } from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import AssignmentCard from '@/components/assignments/AssignmentCard';
import MobileAssignmentItem from '@/components/assignments/MobileAssignmentItem';
import EmptyStateIllustration from '@/components/assignments/EmptyStateIllustration';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, isLoading, fetchAssignments } = useAssignmentStore();
  const [searchQuery, setSearchQuery] = useState('');
  useWebSocket();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = !isLoading && filteredAssignments.length === 0 && searchQuery === '';
  const noResults = !isLoading && filteredAssignments.length === 0 && searchQuery !== '';

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:min-h-0 pb-16 lg:pb-0">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <Header title="Assignment" />
      </div>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* ─── EMPTY STATE ─── */
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
            <EmptyStateIllustration />
            <h2 className="mt-5 text-[17px] font-semibold text-gray-900">No assignments yet</h2>
            <p className="mt-2 text-[13px] text-gray-500 text-center max-w-xs leading-relaxed">
              Create your first assignment to start collecting and grading student submissions.
              You can set up rubrics, define marking criteria, and let AI assist with grading.
            </p>
            <button
              onClick={() => router.push('/assignments/create')}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Your First Assignment
            </button>
          </div>
        ) : (
          /* ─── FILLED STATE ─── */
          <div className="px-5 pt-5 pb-6">
            {/* Page title */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-[18px] font-bold text-gray-900">Assignments</h1>
                {assignments.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-600 rounded-full">
                    {assignments.length}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-gray-500">Manage and create assignments for your classes.</p>
            </div>

            {/* Filters bar */}
            <div className="flex items-center gap-3 mb-5">
              <button className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                <SlidersHorizontal size={13} />
                Filter By
              </button>

              <div className="flex-1 relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* No search results */}
            {noResults && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No assignments found for "{searchQuery}"</p>
              </div>
            )}

            {/* Desktop: Grid layout */}
            {!isLoading && filteredAssignments.length > 0 && (
              <>
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAssignments.map((assignment) => (
                    <AssignmentCard key={assignment._id} assignment={assignment} />
                  ))}
                </div>

                {/* Mobile: list layout */}
                <div className="flex sm:hidden flex-col gap-3">
                  {filteredAssignments.map((assignment) => (
                    <MobileAssignmentItem key={assignment._id} assignment={assignment} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating create button (filled state) */}
      {!isEmpty && (
        <div className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-20">
          <button
            onClick={() => router.push('/assignments/create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-[13px] font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            Create Assignment
          </button>
        </div>
      )}
    </div>
  );
}
