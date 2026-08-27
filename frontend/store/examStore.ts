import { create } from 'zustand';
import { Exam, ExamListItem, ExamStore, WSExamUpdate } from '@/types/exam';
import api from '@/lib/api';

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [],
  currentExam: null,
  selectedQuestionId: null,
  isLoading: false,
  isUploading: false,
  error: null,
  jobStatus: {},

  fetchExams: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/exams');
      set({ exams: data.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchExam: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/exams/${id}`);
      const exam: Exam = data.data;
      set({ currentExam: exam, isLoading: false });
      // Auto-select first question
      if (exam.questions?.length > 0 && !get().selectedQuestionId) {
        set({ selectedQuestionId: exam.questions[0].id });
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createExam: async (formData: FormData) => {
    set({ isUploading: true, error: null });
    try {
      const { data } = await api.post('/exams', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newExam: ExamListItem = data.data;
      set((state) => ({
        exams: [newExam, ...state.exams],
        isUploading: false,
      }));
      return newExam;
    } catch (err: any) {
      set({ error: err.message, isUploading: false });
      throw err;
    }
  },

  deleteExam: async (id: string) => {
    try {
      await api.delete(`/exams/${id}`);
      set((state) => ({
        exams: state.exams.filter((e) => e._id !== id),
        currentExam: state.currentExam?._id === id ? null : state.currentExam,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  setSelectedQuestion: (id: string | null) => {
    set({ selectedQuestionId: id });
  },

  updateExamFromSocket: (data: WSExamUpdate) => {
    set((state) => ({
      jobStatus: {
        ...state.jobStatus,
        [data.examId]: { status: data.status, progress: data.progress, step: data.step },
      },
      // Update currentExam status if it matches
      currentExam:
        state.currentExam?._id === data.examId
          ? { ...state.currentExam, status: data.status, progressStep: data.step }
          : state.currentExam,
      // Update exam in list
      exams: state.exams.map((e) =>
        e._id === data.examId ? { ...e, status: data.status, progressStep: data.step } : e
      ),
    }));

    // On completion, fetch full exam data
    if (data.status === 'completed') {
      get().fetchExam(data.examId);
      get().fetchExams();
    }
  },
}));
