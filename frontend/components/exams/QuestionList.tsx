'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { ExtractedQuestion, MappedAnswer } from '@/types/exam';
import { cn } from '@/lib/utils';

interface QuestionListProps {
  questions: ExtractedQuestion[];
  answers: MappedAnswer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getAnswerStatus(questionId: string, answers: MappedAnswer[]) {
  const answer = answers.find((a) => a.questionId === questionId);
  if (!answer) return 'pending';
  return answer.answered ? 'answered' : 'unanswered';
}

function getTotalScore(answers: MappedAnswer[]): { score: number; max: number } {
  return answers.reduce(
    (acc, a) => ({
      score: acc.score + (a.score || 0),
      max: acc.max + (a.maxScore || 0),
    }),
    { score: 0, max: 0 }
  );
}

export default function QuestionList({
  questions,
  answers,
  selectedId,
  onSelect,
}: QuestionListProps) {
  const { score, max } = getTotalScore(answers);
  const answeredCount = answers.filter((a) => a.answered).length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 w-[260px] flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h3 className="text-[13px] font-semibold text-gray-900">Questions</h3>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] text-gray-500">
            {answeredCount}/{questions.length} answered
          </span>
          {max > 0 && (
            <span className="text-[11px] font-semibold text-orange-600">
              {score}/{max} marks
            </span>
          )}
        </div>
        {/* Score bar */}
        {max > 0 && (
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(score / max) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto py-2">
        {questions.map((q, index) => {
          const status = getAnswerStatus(q.id, answers);
          const answer = answers.find((a) => a.questionId === q.id);
          const isSelected = selectedId === q.id;

          return (
            <motion.button
              key={q.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelect(q.id)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 border-l-2',
                isSelected
                  ? 'bg-orange-50 border-l-[#E8520A]'
                  : 'border-l-transparent hover:bg-gray-50'
              )}
            >
              {/* Q number badge */}
              <span
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5',
                  isSelected ? 'bg-[#E8520A] text-white' : 'bg-gray-100 text-gray-600'
                )}
              >
                {q.number}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-[12px] leading-relaxed line-clamp-2',
                    isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                  )}
                >
                  {q.text}
                </p>

                {/* Status + score row */}
                <div className="flex items-center gap-2 mt-1.5">
                  {status === 'answered' ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                      <CheckCircle size={10} />
                      Answered
                    </span>
                  ) : status === 'unanswered' ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                      <XCircle size={10} />
                      Not attempted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                      <Clock size={10} />
                      Pending
                    </span>
                  )}

                  {answer?.score !== undefined && answer?.maxScore !== undefined && (
                    <span className="text-[10px] font-semibold text-orange-600 ml-auto">
                      {answer.score}/{answer.maxScore}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
