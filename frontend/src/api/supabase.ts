import { apiClient } from './client';

export const fetchStudentsFromDB = async (limit?: number, orderAsc?: boolean) => {
  try {
    const response = await apiClient.get('/students', { params: { limit, orderAsc } });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(error.response?.data?.error || 'Failed to fetch students') };
  }
};

export const insertStudentToDB = async (studentData: any) => {
  try {
    const response = await apiClient.post('/students', studentData);
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(error.response?.data?.error || 'Failed to insert student') };
  }
};

// The backend derives the teacher identity from the verified Supabase session.
// A caller-supplied teacher name or ID is intentionally not accepted.
export const fetchTodayClasses = async (day?: string) => {
  try {
    const response = await apiClient.get('/timetable/today', { params: day ? { day } : {} });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(error.response?.data?.error || 'Failed to fetch timetable') };
  }
};

export const confirmAttendance = async (sessionId: string, records: any[]) => {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/confirm`, { records });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: new Error(error.response?.data?.error || 'Failed to confirm attendance') };
  }
};
