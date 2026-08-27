'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadCard from './UploadCard';
import { useExamStore } from '@/store/examStore';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  const router = useRouter();
  const { createExam, isUploading } = useExamStore();

  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [answerSheet, setAnswerSheet] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [studentName, setStudentName] = useState('');

  const canStart = questionPaper !== null && answerSheet !== null;

  const handleStartMapping = async () => {
    if (!canStart || isUploading) return;

    const formData = new FormData();
    formData.append('questionPaper', questionPaper!);
    formData.append('answerSheet', answerSheet!);
    formData.append('title', title || `Exam — ${new Date().toLocaleDateString('en-IN')}`);
    if (subject) formData.append('subject', subject);
    if (grade) formData.append('grade', grade);
    if (studentName) formData.append('studentName', studentName);

    try {
      const exam = await createExam(formData);
      toast.success('Files uploaded! Processing started...');
      router.push(`/exams/${exam._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 min-h-[calc(100vh-120px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full mb-4">
            <Sparkles size={13} className="text-orange-500" />
            <span className="text-[12px] font-medium text-orange-600">AI-Powered Grading</span>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">
            Upload Question Paper & Answer Sheet
          </h1>
          <p className="text-[13px] text-gray-500">
            Upload both files to get started with AI-powered answer mapping
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Optional metadata row */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Student Name <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Aryan Sharma"
                className="w-full px-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Subject <span className="font-normal normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className="w-full px-3 py-2 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder-gray-400"
              />
            </div>
          </div>

          {/* Upload Cards — side by side on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <UploadCard
              label="Question Paper"
              file={questionPaper}
              onFileSelect={setQuestionPaper}
              onRemove={() => setQuestionPaper(null)}
            />
            <UploadCard
              label="Answer Sheet"
              file={answerSheet}
              onFileSelect={setAnswerSheet}
              onRemove={() => setAnswerSheet(null)}
            />
          </div>

          {/* CTA Button */}
          <button
            onClick={handleStartMapping}
            disabled={!canStart || isUploading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200',
              canStart && !isUploading
                ? 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Start Mapping
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>

          {/* Help text */}
          <p className="text-center text-[11px] text-gray-400 mt-3">
            {canStart
              ? '✓ Both files ready — click Start Mapping to begin AI processing'
              : 'Upload both files to enable AI answer mapping'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
