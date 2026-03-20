'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Eye, Trash2, Clock, Calendar, Loader2 } from 'lucide-react';
import { Assignment } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAssignmentStore } from '@/store/assignmentStore';
import toast from 'react-hot-toast';

interface AssignmentCardProps {
  assignment: Assignment;
}

export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const router = useRouter();
  const deleteAssignment = useAssignmentStore((s) => s.deleteAssignment);
  const jobStatus = useAssignmentStore((s) => s.jobStatus);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentJobStatus = jobStatus[assignment._id];
  const isProcessing =
    assignment.status === 'processing' ||
    currentJobStatus?.status === 'processing' ||
    currentJobStatus?.status === 'queued';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleView = () => {
    setMenuOpen(false);
    router.push(`/assignments/${assignment._id}`);
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    const confirmed = window.confirm(`Delete "${assignment.title}"?`);
    if (!confirmed) return;
    try {
      await deleteAssignment(assignment._id);
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all duration-200 group relative animate-fade-in"
      onClick={handleView}
    >
      {/* Top row: title + menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
          {assignment.title}
        </h3>

        {/* Three-dot menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={15} className="text-gray-500" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-40 bg-white rounded-xl shadow-dropdown border border-gray-100 py-1 animate-scale-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} className="text-gray-500" />
                View Assignment
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      {isProcessing && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <Loader2 size={12} className="animate-spin text-orange-500" />
          <span className="text-[11px] text-orange-500 font-medium">Generating...</span>
        </div>
      )}
      {assignment.status === 'completed' && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-[11px] text-green-600 font-medium">Completed</span>
        </div>
      )}
      {assignment.status === 'failed' && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[11px] text-red-500 font-medium">Failed</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dates */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            <span className="font-medium text-gray-600">Assigned on</span>
          </span>
          <span>{formatDate(assignment.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            <span className="font-medium text-gray-600">Due</span>
          </span>
          <span>{formatDate(assignment.dueDate)}</span>
        </div>
      </div>
    </div>
  );
}
