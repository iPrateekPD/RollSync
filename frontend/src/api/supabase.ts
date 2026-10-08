const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchStudentsFromDB = async (limit?: number, orderAsc?: boolean) => {
  let url = `${API_URL}/students?`;
  
  if (orderAsc !== undefined) {
    url += `orderAsc=${orderAsc}&`;
  }
  if (limit !== undefined) {
    url += `limit=${limit}`;
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return { data: null, error: new Error(errData.error || 'Failed to fetch students') };
  }

  const data = await res.json();
  return { data, error: null };
};

export const insertStudentToDB = async (studentData: any) => {
  const url = `${API_URL}/students`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(studentData)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return { data: null, error: new Error(errData.error || 'Failed to insert student') };
  }

  const data = await res.json();
  return { data, error: null };
};

export const fetchTodayClasses = async (teacherId: string, day?: string) => {
  let url = `${API_URL}/timetable/today?teacher_id=${encodeURIComponent(teacherId)}`;
  if (day) {
    url += `&day=${day}`;
  }
  
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return { data: null, error: new Error(errData.error || 'Failed to fetch timetable') };
  }

  const data = await res.json();
  return { data, error: null };
};
