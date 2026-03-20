'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import QuestionPaperView from '@/components/output/QuestionPaperView';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket, subscribeToAssignment } from '@/hooks/useWebSocket';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const currentAssignment = useAssignmentStore((s) => s.currentAssignment);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(10);

  useWebSocket();

  useEffect(() => {
    if (id) subscribeToAssignment(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Initial load
    const load = async () => {
      try {
        const { data } = await api.get(`/assignments/${id}?t=${Date.now()}`);
        useAssignmentStore.getState().setCurrentAssignment(data.data);
      } catch {}
    };
    load();

    // Poll every 3 seconds
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/assignments/${id}?t=${Date.now()}`);
        useAssignmentStore.getState().setCurrentAssignment(data.data);
      } catch {}
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id]);

  // Stop polling when done
  useEffect(() => {
    if (
      currentAssignment?.status === 'completed' ||
      currentAssignment?.status === 'failed'
    ) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [currentAssignment?.status]);

  // Fake progress animation
  useEffect(() => {
    if (
      currentAssignment?.status === 'processing' ||
      currentAssignment?.status === 'pending'
    ) {
      const timer = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 5));
      }, 2000);
      return () => clearInterval(timer);
    }
    if (currentAssignment?.status === 'completed') {
      setProgress(100);
    }
  }, [currentAssignment?.status]);

  const handleRegenerate = async () => {
    if (!id) return;
    setIsRegenerating(true);
    setProgress(10);
    try {
      await api.post(`/assignments/${id}/regenerate`);
      toast.success('Regenerating question paper...');
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/assignments/${id}?t=${Date.now()}`);
          useAssignmentStore.getState().setCurrentAssignment(data.data);
        } catch {}
      }, 3000);
    } catch {
      toast.error('Failed to regenerate. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const isProcessing =
    currentAssignment?.status === 'processing' ||
    currentAssignment?.status === 'pending';

  // Loading state
  if (!currentAssignment) {
    return (
      <div className="flex flex-col flex-1">
        <div className="hidden lg:block">
          <Header title="Assignment" showBack backHref="/assignments" />
        </div>
        <MobileHeader title="Assignment" showBack backHref="/assignments" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen lg:min-h-0 pb-16 lg:pb-0">
      <div className="hidden lg:block">
        <Header title="Assignment" showBack backHref="/assignments" />
      </div>
      <MobileHeader title={currentAssignment.title} showBack backHref="/assignments" />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* PROCESSING */}
        {isProcessing && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
            <div className="text-center max-w-sm">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[13px] font-bold text-orange-500">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900">
                Generating Question Paper
              </h2>
              <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
                Our AI is crafting a customized question paper. This usually takes 15–30 seconds.
              </p>
              <div className="mt-5">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Auto-updating every 3 seconds...
                </p>
              </div>
              <p className="mt-3 text-[11px] text-gray-400">
                "{currentAssignment.title}"
              </p>
            </div>
          </div>
        )}

        {/* FAILED */}
        {currentAssignment.status === 'failed' && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900">
                Generation Failed
              </h2>
              <p className="mt-2 text-[13px] text-gray-500">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#1A1A1A] text-white text-[13px] font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors disabled:opacity-70"
              >
                {isRegenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED */}
        {currentAssignment.status === 'completed' && currentAssignment.result && (
          <QuestionPaperView
            paper={currentAssignment.result as any}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        )}

      </main>
    </div>
  );
}