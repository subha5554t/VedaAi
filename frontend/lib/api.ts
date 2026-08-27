import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min — AI calls can be slow
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
// ─── Exam API helpers ─────────────────────────────────────────────────────────
export const examApi = {
  list: () => api.get('/exams'),
  get: (id: string) => api.get(`/exams/${id}`),
  create: (formData: FormData) =>
    api.post('/exams', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/exams/${id}`),
  pageImageUrl: (examId: string, sheet: 'question' | 'answer', page: number) =>
    `${BASE_URL}/exams/${examId}/page-image/${sheet}/${page}`,
};
