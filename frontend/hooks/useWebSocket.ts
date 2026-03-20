'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/store/assignmentStore';
import { WSJobUpdate } from '@/types';

let socket: Socket | null = null;
let initialized = false;

export const useWebSocket = () => {
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

      socket.on('job:update', (data: WSJobUpdate) => {
        console.log('WS job update:', data);
        updateJobStatus(data.assignmentId, data.status, data.progress);
        if (data.status === 'completed') {
          fetchAssignment(data.assignmentId);
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
  if (socket && socket.connected) {
    socket.emit('subscribe:assignment', { assignmentId });
    console.log('Subscribed to assignment:', assignmentId);
  } else {
    setTimeout(() => {
      if (socket) {
        socket.emit('subscribe:assignment', { assignmentId });
      }
    }, 2000);
  }
};