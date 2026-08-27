'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useExamStore } from '@/store/examStore';
import { WSExamUpdate } from '@/types/exam';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSJobUpdate } from '@/types';

let socket: Socket | null = null;
let initialized = false;

/**
 * Unified WebSocket hook — handles both assignment and exam job updates.
 * Replaces the old useWebSocket for exam pages.
 */
export const useExamSocket = () => {
  const updateExamFromSocket = useExamStore((s) => s.updateExamFromSocket);
  const updateJobStatus = useAssignmentStore((s) => s.updateJobStatus);
  const fetchAssignment = useAssignmentStore((s) => s.fetchAssignment);

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    try {
      socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('WebSocket connected:', socket?.id);
      });

      socket.on('job:update', (data: WSExamUpdate & WSJobUpdate) => {
        console.log('WS job update:', data);

        if (data.type === 'exam' && data.examId) {
          // Exam update
          updateExamFromSocket(data as WSExamUpdate);
        } else if (data.assignmentId) {
          // Assignment update (backwards compat)
          updateJobStatus(data.assignmentId, data.status, data.progress);
          if (data.status === 'completed') {
            fetchAssignment(data.assignmentId);
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socket.on('connect_error', (err) => {
        console.warn('WebSocket error:', err.message);
      });
    } catch (err) {
      console.warn('Failed to initialize WebSocket:', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        initialized = false;
      }
    };
  }, []);

  return socket;
};

export const subscribeToAssignment = (assignmentId: string) => {
  if (socket?.connected) {
    socket.emit('subscribe:assignment', { assignmentId });
  } else {
    setTimeout(() => socket?.emit('subscribe:assignment', { assignmentId }), 2000);
  }
};

export const subscribeToExam = (examId: string) => {
  if (socket?.connected) {
    socket.emit('subscribe:exam', { examId });
    console.log('Subscribed to exam:', examId);
  } else {
    setTimeout(() => socket?.emit('subscribe:exam', { examId }), 2000);
  }
};
