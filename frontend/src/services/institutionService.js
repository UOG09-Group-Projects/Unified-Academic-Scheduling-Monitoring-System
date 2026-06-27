const BASE_URL = 'http://localhost:8000/api/institutions';

/**
 * Get all institutions
 */
export const getAllInstitutions = async () => {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error('Failed to fetch institutions');
  return res.json();
};

/**
 * Get a single institution by ID
 */
export const getInstitutionById = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/`);
  if (!res.ok) throw new Error('Institution not found');
  return res.json();
};

/**
 * Create a new institution (with owner).
 * Uses FormData because there's a logo file upload.
 */
export const createInstitution = async (formData) => {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    body: formData, // FormData handles multipart automatically
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

/**
 * Update an institution by ID.
 */
export const updateInstitution = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    method: 'PUT',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

/**
 * Soft delete an institution by ID.
 */
export const deleteInstitution = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};