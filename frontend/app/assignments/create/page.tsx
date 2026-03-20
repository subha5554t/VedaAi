'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Mic, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import StepProgress from '@/components/ui/StepProgress';
import FileUploadZone from '@/components/ui/FileUploadZone';
import QuestionTypeRow from '@/components/assignments/QuestionTypeRow';
import { useAssignmentStore } from '@/store/assignmentStore';
import { QuestionTypeConfig } from '@/types';
import { getTotalMarks, getTotalQuestions, generateId } from '@/lib/utils';
import toast from 'react-hot-toast';

const TOTAL_STEPS = 2;

const defaultQuestionTypes: QuestionTypeConfig[] = [
  { id: generateId(), type: 'Multiple Choice Questions', numberOfQuestions: 4, marks: 1 },
  { id: generateId(), type: 'Short Questions', numberOfQuestions: 3, marks: 2 },
  { id: generateId(), type: 'Diagram/Graph-Based Questions', numberOfQuestions: 5, marks: 5 },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { createAssignment, isLoading } = useAssignmentStore();

  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [chapter, setChapter] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Step 2: Question types
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>(defaultQuestionTypes);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (questionTypes.length === 0) {
      newErrors.questionTypes = 'Add at least one question type';
    }
    for (const qt of questionTypes) {
      if (qt.numberOfQuestions < 1) {
        newErrors.questionTypes = 'Number of questions must be at least 1';
        break;
      }
      if (qt.marks < 1) {
        newErrors.questionTypes = 'Marks must be at least 1';
        break;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const addQuestionType = () => {
    setQuestionTypes((prev) => [
      ...prev,
      { id: generateId(), type: 'Short Questions', numberOfQuestions: 3, marks: 2 },
    ]);
  };

  const updateQuestionType = (id: string, updated: QuestionTypeConfig) => {
    setQuestionTypes((prev) => prev.map((qt) => (qt.id === id ? updated : qt)));
  };

  const removeQuestionType = (id: string) => {
    setQuestionTypes((prev) => prev.filter((qt) => qt.id !== id));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    try {
      const assignment = await createAssignment({
        title,
        subject,
        grade,
        chapter,
        dueDate,
        questionTypes,
        additionalInstructions,
        file: file || undefined,
      });

      toast.success('Assignment created! AI is generating your question paper...');
      router.push(`/assignments/${assignment._id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment');
    }
  };

  const totalQuestions = getTotalQuestions(questionTypes);
  const totalMarks = getTotalMarks(questionTypes);

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:min-h-0 pb-16 lg:pb-0">
      {/* Headers */}
      <div className="hidden lg:block">
        <Header title="Assignment" showBack backHref="/assignments" />
      </div>
      <MobileHeader title="Create Assignment" showBack backHref="/assignments" />

      {/* Scrollable main area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">

          {/* Page heading */}
          <div className="mb-5">
            <h1 className="text-[18px] font-bold text-gray-900">Create Assignment</h1>
            <p className="text-[12px] text-gray-500 mt-0.5">Set up a new assignment for your students</p>
          </div>

          {/* Step progress bar */}
          <div className="mb-6">
            <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
          </div>

          {/* ─── STEP 1: Assignment Details ─── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Section header */}
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Assignment Details</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Basic information about your assignment</p>
              </div>

              {/* File Upload */}
              <FileUploadZone file={file} onFileSelect={setFile} />

              {/* Title */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quiz on Electricity"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((p) => ({ ...p, title: '' }));
                  }}
                  className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                />
                {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Subject + Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Grade / Class</label>
                  <input
                    type="text"
                    placeholder="e.g. Class 10"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      if (errors.dueDate) setErrors((p) => ({ ...p, dueDate: '' }));
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Choose a chapter"
                    className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                  />
                </div>
                {errors.dueDate && <p className="text-[11px] text-red-500 mt-1">{errors.dueDate}</p>}
              </div>

              {/* Chapter */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity and Circuits"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 2: Question Types ─── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Question Configuration</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Set question types, number of questions, and marks
                </p>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-2">
                <div className="flex-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Question Type
                </div>
                <div className="w-7 flex-shrink-0" />
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-center w-24 flex-shrink-0">
                  No. of Questions
                </div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-center w-24 flex-shrink-0">
                  Marks
                </div>
              </div>

              {/* Question type rows */}
              <div className="space-y-3">
                {questionTypes.map((qt) => (
                  <QuestionTypeRow
                    key={qt.id}
                    config={qt}
                    onChange={(updated) => updateQuestionType(qt.id, updated)}
                    onRemove={() => removeQuestionType(qt.id)}
                    canRemove={questionTypes.length > 1}
                  />
                ))}
              </div>

              {errors.questionTypes && (
                <p className="text-[11px] text-red-500">{errors.questionTypes}</p>
              )}

              {/* Add question type */}
              <button
                type="button"
                onClick={addQuestionType}
                className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <Plus size={13} />
                </div>
                Add Question Type
              </button>

              {/* Totals */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-end gap-6 text-[13px]">
                  <span className="text-gray-500">
                    Total Questions : <span className="font-semibold text-gray-900">{totalQuestions}</span>
                  </span>
                  <span className="text-gray-500">
                    Total Marks : <span className="font-semibold text-gray-900">{totalMarks}</span>
                  </span>
                </div>
              </div>

              {/* Additional instructions */}
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Additional Information{' '}
                  <span className="text-gray-400 font-normal">(For better output)</span>
                </label>
                <div className="relative">
                  <textarea
                    placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 pr-10 text-[13px] bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-colors resize-none"
                  />
                  <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
                    <Mic size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors"
              >
                Next
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white rounded-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Generate Paper
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
