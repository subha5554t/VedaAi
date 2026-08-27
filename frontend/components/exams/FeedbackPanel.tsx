'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, MessageSquare, BookOpen } from 'lucide-react';
import { ExtractedQuestion, MappedAnswer } from '@/types/exam';
import { cn } from '@/lib/utils';

interface FeedbackPanelProps {
  question: ExtractedQuestion | null;
  answer: MappedAnswer | null;
  totalQuestions: number;
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-400' : 'bg-red-400';

  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-500">Score</span>
        <span className={cn('font-bold', pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-orange-600' : 'text-red-600')}>
          {score} / {max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function FeedbackPanel({
  question,
  answer,
  totalQuestions,
  currentIndex,
  onPrev,
  onNext,
}: FeedbackPanelProps) {
  if (!question) {
    return (
      <div className="w-[280px] flex-shrink-0 bg-white flex items-center justify-center">
        <p className="text-[13px] text-gray-400">Select a question</p>
      </div>
    );
  }

  return (
    <div className="w-[280px] flex-shrink-0 bg-white flex flex-col overflow-hidden">
      {/* Navigation header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[12px] text-gray-500">
          Q {currentIndex + 1} of {totalQuestions}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Question */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={13} className="text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Question {question.number}</span>
            {question.marks && (
              <span className="ml-auto text-[10px] font-medium text-gray-400">{question.marks} mark{question.marks > 1 ? 's' : ''}</span>
            )}
          </div>
          <p className="text-[13px] text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
            {question.text}
          </p>
        </div>

        {/* Answer status */}
        {answer && !answer.answered ? (
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-[12px] font-medium text-red-600">Not Attempted</p>
            <p className="text-[11px] text-red-400 mt-0.5">Student did not answer this question.</p>
          </div>
        ) : answer?.answerText ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className="text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Student's Answer</span>
            </div>
            <p className="text-[13px] text-gray-700 leading-relaxed bg-blue-50 rounded-lg p-3 border border-blue-100 font-mono">
              {answer.answerText}
            </p>
          </div>
        ) : null}

        {/* Score */}
        {answer?.score !== undefined && answer?.maxScore !== undefined && (
          <ScoreBar score={answer.score} max={answer.maxScore} />
        )}

        {/* AI Feedback */}
        {answer?.feedback && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={13} className="text-orange-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">AI Feedback</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-orange-50 rounded-lg border border-orange-100"
            >
              <p className="text-[12px] text-orange-900 leading-relaxed">
                {answer.feedback}
              </p>
            </motion.div>
          </div>
        )}

        {/* No feedback yet */}
        {answer?.answered && !answer?.feedback && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-[12px] text-gray-400 text-center">Feedback will appear after processing completes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
