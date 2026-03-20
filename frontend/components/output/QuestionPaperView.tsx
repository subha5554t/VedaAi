'use client';

import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Difficulty } from '@/types';
import { cn } from '@/lib/utils';

interface QuestionPaperViewProps {
  paper: any;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const classes = {
    Easy: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Hard: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border',
        classes[difficulty] || classes['Medium']
      )}
    >
      {difficulty}
    </span>
  );
}

export default function QuestionPaperView({
  paper,
  onRegenerate,
  isRegenerating,
}: QuestionPaperViewProps) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Action Bar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3">
        <p className="text-[12px] text-gray-500 hidden sm:block">
          Question paper for{' '}
          <span className="font-medium text-gray-700">{paper.subject}</span>
          {paper.grade && (
            <>
              {' '}
              ·{' '}
              <span className="font-medium text-gray-700">{paper.grade}</span>
            </>
          )}{' '}
          · {paper.totalQuestions} questions · {paper.totalMarks} marks
        </p>
        <div className="flex items-center gap-2 ml-auto">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw
                size={13}
                className={isRegenerating ? 'animate-spin' : ''}
              />
              Regenerate
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <Download size={13} />
            Download as PDF
          </button>
        </div>
      </div>

      {/* Question Paper */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm question-paper">
          <div className="p-8 sm:p-12 print:p-8">

            {/* Header */}
            <div className="text-center mb-8 border-b border-gray-200 pb-6">
              <h1 className="text-[18px] font-bold text-gray-900">
                {paper.schoolName}
              </h1>
              <div className="mt-2 space-y-0.5">
                <p className="text-[13px] text-gray-700">
                  <span className="font-semibold">Subject:</span> {paper.subject}
                </p>
                <p className="text-[13px] text-gray-700">
                  <span className="font-semibold">Class:</span> {paper.grade}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4 text-[12px] text-gray-600">
                <span>Time Allowed: {paper.timeAllowed}</span>
                <span>Maximum Marks: {paper.maximumMarks}</span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 italic">
                All questions are compulsory unless stated otherwise.
              </p>
            </div>

            {/* Student Info */}
            <div className="mb-6 grid grid-cols-3 gap-x-6 gap-y-2">
              <div className="col-span-3 sm:col-span-1">
                <span className="text-[12px] text-gray-600">Name: </span>
                <span className="inline-block border-b border-gray-400 w-32 ml-1" />
              </div>
              <div>
                <span className="text-[12px] text-gray-600">Roll Number: </span>
                <span className="inline-block border-b border-gray-400 w-16 ml-1" />
              </div>
              <div>
                <span className="text-[12px] text-gray-600">Section: </span>
                <span className="inline-block border-b border-gray-400 w-16 ml-1" />
              </div>
            </div>

            {/* Sections */}
            {paper.sections.map((section: any, sectionIndex: number) => (
              <div key={section.id} className="mb-8">
                <div className="mb-3">
                  <h2 className="text-[15px] font-bold text-gray-900">
                    {section.title}
                  </h2>
                  <p className="text-[12px] text-gray-500 mt-0.5 italic">
                    {section.instruction}
                  </p>
                </div>

                <div className="space-y-5">
                  {section.questions.map((question: any, qIndex: number) => {
                    const globalNum =
                      paper.sections
                        .slice(0, sectionIndex)
                        .reduce(
                          (sum: number, s: any) => sum + s.questions.length,
                          0
                        ) +
                      qIndex +
                      1;

                    return (
                      <div key={question.id} className="flex gap-3">
                        <span className="text-[13px] font-semibold text-gray-800 flex-shrink-0 w-6">
                          {globalNum}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] text-gray-800 leading-relaxed flex-1">
                              {question.text}
                            </p>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <DifficultyBadge difficulty={question.difficulty} />
                              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                                [{question.marks}{' '}
                                {question.marks === 1 ? 'mark' : 'marks'}]
                              </span>
                            </div>
                          </div>

                          {question.options && question.options.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                              {question.options.map(
                                (opt: string, optIdx: number) => (
                                  <p
                                    key={optIdx}
                                    className="text-[12px] text-gray-700"
                                  >
                                    ({String.fromCharCode(97 + optIdx)}) {opt}
                                  </p>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-right text-[11px] text-gray-500">
                  Section Total:{' '}
                  <span className="font-semibold">{section.totalMarks} marks</span>
                </div>
              </div>
            ))}

            {/* Answer Key */}
            <details className="mt-8 border-t border-gray-200 pt-6">
              <summary className="text-[13px] font-semibold text-gray-700 cursor-pointer hover:text-gray-900 select-none">
                Answer Key (Teacher Reference)
              </summary>
              <div className="mt-4 space-y-4">
                {paper.sections.map((section: any, sIdx: number) => (
                  <div key={section.id}>
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.questions.map((q: any, qIdx: number) => {
                        const globalNum =
                          paper.sections
                            .slice(0, sIdx)
                            .reduce(
                              (sum: number, s: any) => sum + s.questions.length,
                              0
                            ) +
                          qIdx +
                          1;
                        return q.answer ? (
                          <div key={q.id} className="flex gap-2">
                            <span className="text-[12px] text-gray-600 font-medium w-5 flex-shrink-0">
                              {globalNum}.
                            </span>
                            <p className="text-[12px] text-gray-700 leading-relaxed">
                              {q.answer}
                            </p>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-gray-200 text-center">
              <p className="text-[11px] text-gray-400">
                Total Questions: {paper.totalQuestions} | Total Marks:{' '}
                {paper.totalMarks}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Generated by VedaAI • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}