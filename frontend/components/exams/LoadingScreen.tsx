'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, FileText, ScanText, GitMerge, Star, Sparkles } from 'lucide-react';
import { ExamStatus } from '@/types/exam';
import { cn } from '@/lib/utils';

interface Step {
  key: ExamStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    key: 'uploading',
    label: 'Files Uploaded',
    description: 'Question paper & answer sheet received',
    icon: <FileText size={16} />,
  },
  {
    key: 'extracting',
    label: 'Extracting Questions',
    description: 'Reading and parsing question paper...',
    icon: <ScanText size={16} />,
  },
  {
    key: 'analyzing',
    label: 'Analyzing Answer Sheet',
    description: 'Scanning handwritten responses...',
    icon: <ScanText size={16} />,
  },
  {
    key: 'mapping',
    label: 'Mapping Answers',
    description: 'Matching answers to questions...',
    icon: <GitMerge size={16} />,
  },
  {
    key: 'grading',
    label: 'Generating AI Feedback',
    description: 'Evaluating and scoring responses...',
    icon: <Sparkles size={16} />,
  },
];

const STATUS_ORDER: ExamStatus[] = [
  'uploading',
  'extracting',
  'analyzing',
  'mapping',
  'grading',
  'completed',
];

function getActiveStepIndex(status: ExamStatus): number {
  return STATUS_ORDER.indexOf(status);
}

interface LoadingScreenProps {
  status: ExamStatus;
  progressStep: string;
  progress: number;
  errorMessage?: string;
}

export default function LoadingScreen({
  status,
  progressStep,
  progress,
  errorMessage,
}: LoadingScreenProps) {
  const [dots, setDots] = useState('');
  const activeIndex = getActiveStepIndex(status);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-[17px] font-semibold text-gray-900 mb-2">Processing Failed</h2>
        <p className="text-[13px] text-gray-500 text-center max-w-sm">
          {errorMessage || 'Something went wrong while processing your files.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Animated icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg"
          >
            <Star size={28} className="text-white" />
          </motion.div>
        </div>

        {/* Current step title */}
        <div className="text-center mb-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">
            {progressStep || `Processing${dots}`}
          </h2>
          <p className="text-[12px] text-gray-500">This may take 30–60 seconds</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progress, 5)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-3 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          {STEPS.map((step, index) => {
            const isDone = index < activeIndex;
            const isCurrent = index === activeIndex;
            const isPending = index > activeIndex;

            return (
              <AnimatePresence key={step.key} mode="wait">
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  {/* Step indicator */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                      isDone && 'bg-green-100',
                      isCurrent && 'bg-orange-100',
                      isPending && 'bg-gray-100'
                    )}
                  >
                    {isDone ? (
                      <Check size={13} className="text-green-600" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <Loader2 size={13} className="text-orange-500 animate-spin" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    )}
                  </div>

                  {/* Step text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-[13px] font-medium transition-colors',
                        isDone && 'text-green-700',
                        isCurrent && 'text-gray-900',
                        isPending && 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] text-gray-500">{step.description}</p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
