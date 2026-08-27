'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';
import { ExtractedQuestion, MappedAnswer, BoundingBox } from '@/types/exam';
import { examApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AnswerViewerProps {
  examId: string;
  answerSheetPages: number;
  selectedQuestion: ExtractedQuestion | null;
  selectedAnswer: MappedAnswer | null;
}

function drawHighlight(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  box: BoundingBox,
  questionNumber: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!box.width || !box.height) return;

  const x = (box.left / 100) * canvas.width;
  const y = (box.top / 100) * canvas.height;
  const w = (box.width / 100) * canvas.width;
  const h = (box.height / 100) * canvas.height;

  const radius = 6;

  // Draw semi-transparent fill
  ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();

  // Draw badge
  const badgeText = `Q${questionNumber}`;
  ctx.font = 'bold 12px Inter, sans-serif';
  const textWidth = ctx.measureText(badgeText).width;
  const bx = x;
  const by = y - 22;

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.roundRect(bx, by, textWidth + 12, 20, 4);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.fillText(badgeText, bx + 6, by + 14);
}

export default function AnswerViewer({
  examId,
  answerSheetPages,
  selectedQuestion,
  selectedAnswer,
}: AnswerViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Switch to the page where this answer lives
  useEffect(() => {
    if (selectedAnswer?.answered && selectedAnswer?.pageIndex !== undefined) {
      setCurrentPage(selectedAnswer.pageIndex);
    }
  }, [selectedAnswer]);

  const imageUrl = examApi.pageImageUrl(examId, 'answer', currentPage + 1); // 1-indexed

  // Redraw highlight when image loads or question changes
  const handleImageLoad = useCallback(() => {
    setImgLoaded(true);
    setImgError(false);
    if (imgRef.current && canvasRef.current && selectedAnswer?.answered) {
      const img = imgRef.current;
      canvasRef.current.width = img.naturalWidth;
      canvasRef.current.height = img.naturalHeight;
      if (selectedAnswer.boundingBox && selectedQuestion) {
        drawHighlight(canvasRef.current, img, selectedAnswer.boundingBox, selectedQuestion.number);
      }
    }
  }, [selectedAnswer, selectedQuestion]);

  // Redraw on question change (image already loaded)
  useEffect(() => {
    if (imgLoaded && imgRef.current && canvasRef.current) {
      if (selectedAnswer?.answered && selectedAnswer?.pageIndex === currentPage) {
        if (selectedAnswer.boundingBox && selectedQuestion) {
          drawHighlight(canvasRef.current, imgRef.current, selectedAnswer.boundingBox, selectedQuestion.number);
        }
      } else {
        // Clear canvas if answer not on this page
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [selectedAnswer, selectedQuestion, currentPage, imgLoaded]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <span className="text-[12px] font-medium text-gray-600">Answer Sheet</span>
        {answerSheetPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[12px] text-gray-600">
              Page {currentPage + 1} / {answerSheetPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(answerSheetPages - 1, p + 1))}
              disabled={currentPage === answerSheetPages - 1}
              className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Image + Canvas overlay */}
      <div className="flex-1 overflow-auto p-4" ref={containerRef}>
        {!selectedQuestion ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileQuestion size={40} strokeWidth={1.25} className="mb-3" />
            <p className="text-[13px]">Select a question to see the answer</p>
          </div>
        ) : selectedAnswer && !selectedAnswer.answered ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <FileQuestion size={22} className="text-red-400" />
              </div>
              <p className="text-[13px] font-medium text-gray-700">Not attempted</p>
              <p className="text-[12px] text-gray-400 mt-1">
                No answer found for this question
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPage}-${selectedQuestion?.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative inline-block w-full"
            >
              {/* Page image */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt={`Answer sheet page ${currentPage + 1}`}
                onLoad={handleImageLoad}
                onError={() => setImgError(true)}
                className={cn(
                  'w-full rounded-lg shadow-sm border border-gray-200',
                  !imgLoaded && 'opacity-0'
                )}
              />

              {/* Skeleton while loading */}
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse" />
              )}

              {/* Canvas overlay for highlight */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
