'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSJobUpdate } from '@/types';

let socket: Socket | null = null;

export const useWebSocket = () => {
  const updateJobStatus = useAssignmentStore((s) => s.updateJobStatus);
  const fetchAssignment = useAssignmentStore((s) => s.fetchAssignment);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    try {
      socket = io(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      socket.on('job:update', (data: WSJobUpdate) => {
        updateJobStatus(data.assignmentId, data.status, data.progress);
        if (data.status === 'completed') {
          fetchAssignment(data.assignmentId);
        }
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socket.on('connect_error', (err) => {
        console.warn('WebSocket connection error:', err.message);
      });
    } catch (err) {
      console.warn('Failed to initialize WebSocket:', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        initialized.current = false;
      }
    };
  }, []);

  return socket;
};

export const subscribeToAssignment = (assignmentId: string) => {
  if (socket) {
    socket.emit('subscribe:assignment', { assignmentId });
  }
};
