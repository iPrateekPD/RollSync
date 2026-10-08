const SUPABASE_URL = '/supabase-api';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SECRET_KEY;

export const fetchStudentsFromDB = async (limit?: number, orderAsc?: boolean) => {
  let url = `${SUPABASE_URL}/rest/v1/students?select=*`;
  
  if (orderAsc !== undefined) {
    url += `&order=roll_number.${orderAsc ? 'asc' : 'desc'}`;
  }
  if (limit !== undefined) {
    url += `&limit=${limit}`;
  }

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    const err = await res.text();
    return { data: null, error: new Error(err) };
  }

  const data = await res.json();
  return { data, error: null };
};
