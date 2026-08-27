'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardCheck, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import UploadPage from '@/components/exams/UploadPage';
import { useExamStore } from '@/store/examStore';
import { useExamSocket } from '@/hooks/useExamSocket';
import { ExamListItem, ExamStatus } from '@/types/exam';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: ExamStatus }) {
  const configs = {
    completed: { icon: CheckCircle, label: 'Completed', className: 'text-green-600 bg-green-50 border-green-100' },
    failed: { icon: AlertCircle, label: 'Failed', className: 'text-red-600 bg-red-50 border-red-100' },
    pending: { icon: Clock, label: 'Queued', className: 'text-gray-500 bg-gray-50 border-gray-100' },
    extracting: { icon: Loader2, label: 'Extracting...', className: 'text-orange-600 bg-orange-50 border-orange-100' },
    analyzing: { icon: Loader2, label: 'Analyzing...', className: 'text-orange-600 bg-orange-50 border-orange-100' },
    mapping: { icon: Loader2, label: 'Mapping...', className: 'text-orange-600 bg-orange-50 border-orange-100' },
    grading: { icon: Loader2, label: 'Grading...', className: 'text-orange-600 bg-orange-50 border-orange-100' },
    uploading: { icon: Loader2, label: 'Uploading...', className: 'text-blue-600 bg-blue-50 border-blue-100' },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  const isProcessing = ['extracting', 'analyzing', 'mapping', 'grading', 'uploading'].includes(status);

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium', config.className)}>
      <Icon size={10} className={isProcessing ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

function ExamCard({ exam }: { exam: ExamListItem }) {
  const router = useRouter();
  const { deleteExam } = useExamStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this exam?')) return;
    await deleteExam(exam._id);
    toast.success('Exam deleted');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => router.push(`/exams/${exam._id}`)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-gray-900 truncate">{exam.title}</h3>
          {exam.studentName && (
            <p className="text-[12px] text-gray-500 mt-0.5">{exam.studentName}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={exam.status} />
        {exam.subject && (
          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {exam.subject}
          </span>
        )}
        {exam.grade && (
          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            Grade {exam.grade}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        {exam.totalScore !== undefined && exam.totalMaxScore !== undefined ? (
          <span className="text-[12px] font-bold text-orange-600">
            Score: {exam.totalScore}/{exam.totalMaxScore}
          </span>
        ) : <span />}
        <span className="text-[11px] text-gray-400">
          {formatDistanceToNow(new Date(exam.createdAt), { addSuffix: true })}
        </span>
      </div>
    </motion.div>
  );
}

export default function ExamsPage() {
  const { exams, isLoading, fetchExams } = useExamStore();
  const [showUpload, setShowUpload] = React.useState(false);
  useExamSocket();

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const isEmpty = !isLoading && exams.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:min-h-0 pb-16 lg:pb-0">
      <div className="hidden lg:block">
        <Header title="Exams" />
      </div>
      <MobileHeader />

      <main className="flex-1 overflow-y-auto">
        {/* Show upload form inline or as overlay */}
        {showUpload || isEmpty ? (
          <div className="relative">
            {!isEmpty && (
              <button
                onClick={() => setShowUpload(false)}
                className="absolute top-4 right-4 z-10 text-[12px] text-gray-500 hover:text-gray-700"
              >
                ← Back to Exams
              </button>
            )}
            <UploadPage />
          </div>
        ) : (
          <div className="px-5 pt-5 pb-6">
            {/* Page header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-bold text-gray-900">Exams</h1>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-600 rounded-full">
                    {exams.length}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">AI-powered answer sheet evaluation</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                <Plus size={14} />
                New Exam
              </button>
            </div>

            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Exam cards */}
            {!isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <ExamCard key={exam._id} exam={exam} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB — new exam */}
      {!isEmpty && !showUpload && (
        <div className="fixed bottom-20 right-5 lg:bottom-6 lg:right-6 z-20">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg text-[13px] font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            New Exam
          </button>
        </div>
      )}
    </div>
  );
}
