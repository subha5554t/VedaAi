'use client';

import React from 'react';
import { X, ChevronDown, Minus, Plus } from 'lucide-react';
import { QuestionTypeConfig, QuestionType } from '@/types';

const QUESTION_TYPES: QuestionType[] = [
  'Multiple Choice Questions',
  'Short Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Long Answer Questions',
  'True/False',
  'Fill in the Blanks',
];

interface QuestionTypeRowProps {
  config: QuestionTypeConfig;
  onChange: (updated: QuestionTypeConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function QuestionTypeRow({
  config,
  onChange,
  onRemove,
  canRemove,
}: QuestionTypeRowProps) {
  const updateCount = (delta: number) => {
    const newVal = Math.max(1, config.numberOfQuestions + delta);
    onChange({ ...config, numberOfQuestions: newVal });
  };

  const updateMarks = (delta: number) => {
    const newVal = Math.max(1, config.marks + delta);
    onChange({ ...config, marks: newVal });
  };

  const handleCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) {
      onChange({ ...config, numberOfQuestions: val });
    }
  };

  const handleMarksInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1) {
      onChange({ ...config, marks: val });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      {/* Type selector */}
      <div className="relative flex-1 min-w-0">
        <select
          value={config.type}
          onChange={(e) => onChange({ ...config, type: e.target.value as QuestionType })}
          className="w-full appearance-none pl-3 pr-8 py-2.5 text-[13px] text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors cursor-pointer"
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Remove X button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      )}

      {/* No. of Questions counter */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => updateCount(-1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Minus size={11} />
        </button>
        <input
          type="number"
          value={config.numberOfQuestions}
          onChange={handleCountInput}
          min={1}
          className="w-10 text-center text-[13px] font-medium py-1 border border-gray-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
        />
        <button
          type="button"
          onClick={() => updateCount(1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Marks counter */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => updateMarks(-1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Minus size={11} />
        </button>
        <input
          type="number"
          value={config.marks}
          onChange={handleMarksInput}
          min={1}
          className="w-10 text-center text-[13px] font-medium py-1 border border-gray-200 rounded focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100"
        />
        <button
          type="button"
          onClick={() => updateMarks(1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}
