const BASE_URL = 'http://localhost:8000/api/institutions';

export const getAllInstitutions = async () => {
  const res = await fetch(`${BASE_URL}/`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch institutions');
  return res.json();
};

export const getInstitutionById = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Institution not found');
  return res.json();
};

export const createInstitution = async (formData) => {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    credentials: 'include',
    body: formData, // FormData handles multipart automatically
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const updateInstitution = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const deleteInstitution = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};