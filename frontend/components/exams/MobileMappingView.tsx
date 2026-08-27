'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, XCircle, Star, MessageSquare, BookOpen, Image } from 'lucide-react';
import { Exam, ExtractedQuestion, MappedAnswer } from '@/types/exam';
import { examApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MobileMappingViewProps {
  exam: Exam;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function QuestionCard({
  question,
  answer,
  onClick,
}: {
  question: ExtractedQuestion;
  answer?: MappedAnswer;
  onClick: () => void;
}) {
  const answered = answer?.answered;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        {/* Q badge */}
        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-700 mt-0.5">
          {question.number}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-gray-800 leading-relaxed line-clamp-2">{question.text}</p>

          <div className="flex items-center gap-2 mt-2">
            {answered ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                <CheckCircle size={10} /> Answered
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                <XCircle size={10} /> Not attempted
              </span>
            )}

            {answer?.score !== undefined && answer?.maxScore !== undefined && (
              <span className="text-[10px] font-bold text-orange-600 ml-auto">
                {answer.score}/{answer.maxScore}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailView({
  question,
  answer,
  examId,
  answerSheetPages,
  onBack,
}: {
  question: ExtractedQuestion;
  answer?: MappedAnswer;
  examId: string;
  answerSheetPages: number;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'sheet'>('details');

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <span className="text-[14px] font-semibold text-gray-900">Question {question.number}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['details', 'sheet'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 text-[13px] font-medium transition-colors',
              activeTab === tab
                ? 'text-[#E8520A] border-b-2 border-[#E8520A]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab === 'details' ? (
              <span className="flex items-center justify-center gap-1.5">
                <BookOpen size={13} /> Question Details
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Image size={13} /> Answer Sheet
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <div className="p-4 space-y-4">
            {/* Question */}
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Question</p>
              <p className="text-[14px] text-gray-900 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                {question.text}
              </p>
            </div>

            {/* Answer */}
            {answer?.answered && answer?.answerText ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare size={12} className="text-gray-400" />
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student's Answer</p>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed bg-blue-50 rounded-xl p-3 border border-blue-100 font-mono">
                  {answer.answerText}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[13px] font-medium text-red-600">Not Attempted</p>
              </div>
            )}

            {/* Score */}
            {answer?.score !== undefined && answer?.maxScore !== undefined && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                <span className="text-[13px] font-medium text-orange-800">Score</span>
                <span className="text-[18px] font-bold text-orange-600">
                  {answer.score}/{answer.maxScore}
                </span>
              </div>
            )}

            {/* Feedback */}
            {answer?.feedback && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star size={12} className="text-orange-400" />
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">AI Feedback</p>
                </div>
                <p className="text-[13px] text-orange-900 leading-relaxed bg-orange-50 rounded-xl p-3 border border-orange-100">
                  {answer.feedback}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {answer?.answered && answer?.pageIndex !== undefined ? (
              <div className="relative">
                <img
                  src={examApi.pageImageUrl(examId, 'answer', answer.pageIndex + 1)}
                  alt="Answer sheet"
                  className="w-full rounded-xl border border-gray-200 shadow-sm"
                />
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  Page {answer.pageIndex + 1}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Image size={36} strokeWidth={1.25} className="mb-3" />
                <p className="text-[13px]">No answer found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MobileMappingView({ exam, selectedId, onSelect }: MobileMappingViewProps) {
  const selectedQuestion = exam.questions.find((q) => q.id === selectedId) || null;
  const selectedAnswer = exam.answers.find((a) => a.questionId === selectedId);

  return (
    <div className="flex flex-col gap-3 p-4 pb-20">
      {/* Summary bar */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-gray-900">{exam.title}</p>
          {exam.studentName && (
            <p className="text-[11px] text-gray-500">{exam.studentName}</p>
          )}
        </div>
        {exam.totalScore !== undefined && exam.totalMaxScore !== undefined && (
          <div className="text-right">
            <p className="text-[18px] font-bold text-orange-600">
              {exam.totalScore}/{exam.totalMaxScore}
            </p>
            <p className="text-[10px] text-gray-400">Total Score</p>
          </div>
        )}
      </div>

      {/* Question cards */}
      {exam.questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          answer={exam.answers.find((a) => a.questionId === q.id)}
          onClick={() => onSelect(q.id)}
        />
      ))}

      {/* Detail view overlay */}
      <AnimatePresence>
        {selectedQuestion && (
          <DetailView
            question={selectedQuestion}
            answer={selectedAnswer}
            examId={exam._id}
            answerSheetPages={exam.answerSheetPages}
            onBack={() => onSelect(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
