'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Eye, Trash2, Loader2 } from 'lucide-react';
import { Assignment } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAssignmentStore } from '@/store/assignmentStore';
import toast from 'react-hot-toast';

interface MobileAssignmentItemProps {
  assignment: Assignment;
}

export default function MobileAssignmentItem({ assignment }: MobileAssignmentItemProps) {
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

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => router.push(`/assignments/${assignment._id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-gray-900 truncate">{assignment.title}</h3>

          {isProcessing && (
            <div className="flex items-center gap-1 mt-0.5">
              <Loader2 size={10} className="animate-spin text-orange-500" />
              <span className="text-[10px] text-orange-500">Generating...</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-gray-500">
              <span className="font-medium text-gray-700">Assigned on</span> : {formatDate(assignment.createdAt)}
            </span>
            {assignment.dueDate && (
              <span className="text-[10px] text-gray-500">
                <span className="font-medium text-gray-700">Due</span> : {formatDate(assignment.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Three dot */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((p) => !p);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100"
          >
            <MoreVertical size={15} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-30 w-36 bg-white rounded-xl shadow-dropdown border border-gray-100 py-1 animate-scale-in">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  router.push(`/assignments/${assignment._id}`);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
              >
                <Eye size={13} />
                View
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  try {
                    await deleteAssignment(assignment._id);
                    toast.success('Deleted');
                  } catch {
                    toast.error('Failed to delete');
                  }
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-red-500 hover:bg-red-50"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
