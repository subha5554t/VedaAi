'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import LoadingScreen from '@/components/exams/LoadingScreen';
import QuestionList from '@/components/exams/QuestionList';
import AnswerViewer from '@/components/exams/AnswerViewer';
import FeedbackPanel from '@/components/exams/FeedbackPanel';
import MobileMappingView from '@/components/exams/MobileMappingView';
import { useExamStore } from '@/store/examStore';
import { useExamSocket, subscribeToExam } from '@/hooks/useExamSocket';
import { ArrowLeft } from 'lucide-react';

const PROCESSING_STATUSES = ['pending', 'uploading', 'extracting', 'analyzing', 'mapping', 'grading'];

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { currentExam, selectedQuestionId, jobStatus, fetchExam, setSelectedQuestion } = useExamStore();
  const socket = useExamSocket();

  // Fetch exam on mount
  useEffect(() => {
    if (id) fetchExam(id);
  }, [id, fetchExam]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (id) subscribeToExam(id);
  }, [id, socket]);

  // Poll while processing
  useEffect(() => {
    if (!currentExam) return;
    if (!PROCESSING_STATUSES.includes(currentExam.status)) return;

    const interval = setInterval(() => fetchExam(id), 5000);
    return () => clearInterval(interval);
  }, [currentExam?.status, id, fetchExam]);

  // Derived state
  const liveStatus = jobStatus[id] || null;
  const status = (liveStatus?.status || currentExam?.status) as any;
  const progress = liveStatus?.progress ?? 0;
  const progressStep = liveStatus?.step || currentExam?.progressStep || '';

  const isProcessing = PROCESSING_STATUSES.includes(status);

  const selectedQuestion = useMemo(
    () => currentExam?.questions.find((q) => q.id === selectedQuestionId) || null,
    [currentExam?.questions, selectedQuestionId]
  );

  const selectedAnswer = useMemo(
    () => currentExam?.answers.find((a) => a.questionId === selectedQuestionId) || null,
    [currentExam?.answers, selectedQuestionId]
  );

  const currentQuestionIndex = useMemo(
    () => currentExam?.questions.findIndex((q) => q.id === selectedQuestionId) ?? 0,
    [currentExam?.questions, selectedQuestionId]
  );

  const handlePrev = () => {
    if (!currentExam || currentQuestionIndex <= 0) return;
    setSelectedQuestion(currentExam.questions[currentQuestionIndex - 1].id);
  };

  const handleNext = () => {
    if (!currentExam || currentQuestionIndex >= currentExam.questions.length - 1) return;
    setSelectedQuestion(currentExam.questions[currentQuestionIndex + 1].id);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:min-h-0 pb-16 lg:pb-0 overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        <Header
          title={currentExam?.title || 'Exam'}
          showBack
          backHref="/exams"
        />
      </div>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Loading state */}
      {(!currentExam || isProcessing) && (
        <LoadingScreen
          status={status || 'pending'}
          progressStep={progressStep}
          progress={progress}
          errorMessage={currentExam?.errorMessage}
        />
      )}

      {/* Completed — Desktop 3-panel layout */}
      {currentExam && status === 'completed' && (
        <>
          {/* Desktop */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            <QuestionList
              questions={currentExam.questions}
              answers={currentExam.answers}
              selectedId={selectedQuestionId}
              onSelect={setSelectedQuestion}
            />
            <AnswerViewer
              examId={currentExam._id}
              answerSheetPages={currentExam.answerSheetPages}
              selectedQuestion={selectedQuestion}
              selectedAnswer={selectedAnswer}
            />
            <FeedbackPanel
              question={selectedQuestion}
              answer={selectedAnswer}
              totalQuestions={currentExam.questions.length}
              currentIndex={currentQuestionIndex}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex-1 overflow-y-auto">
            <MobileMappingView
              exam={currentExam}
              selectedId={selectedQuestionId}
              onSelect={setSelectedQuestion}
            />
          </div>
        </>
      )}
    </div>
  );
}
