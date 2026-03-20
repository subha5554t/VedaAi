import { create } from 'zustand';
import { Assignment, AssignmentStore, CreateAssignmentPayload, QuestionPaper } from '@/types';
import api from '@/lib/api';

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,
  jobStatus: {},

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/assignments');
      set({ assignments: data.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createAssignment: async (payload: CreateAssignmentPayload) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      if (payload.subject) formData.append('subject', payload.subject);
      if (payload.grade) formData.append('grade', payload.grade);
      if (payload.chapter) formData.append('chapter', payload.chapter);
      formData.append('dueDate', payload.dueDate);
      formData.append('questionTypes', JSON.stringify(payload.questionTypes));
      if (payload.additionalInstructions)
        formData.append('additionalInstructions', payload.additionalInstructions);
      if (payload.file) formData.append('file', payload.file);

      const { data } = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAssignment: Assignment = data.data;
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        currentAssignment: newAssignment,
        isLoading: false,
      }));

      return newAssignment;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchAssignment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/assignments/${id}`);
      set({ currentAssignment: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      await api.delete(`/assignments/${id}`);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateJobStatus: (assignmentId: string, status: string, progress: number) => {
    set((state) => ({
      jobStatus: {
        ...state.jobStatus,
        [assignmentId]: { status, progress },
      },
    }));

    // If completed, refresh the assignment
    if (status === 'completed') {
      get().fetchAssignment(assignmentId);
      get().fetchAssignments();
    }
  },

  setCurrentAssignment: (assignment: Assignment | null) => {
    set({ currentAssignment: assignment });
  },
}));
