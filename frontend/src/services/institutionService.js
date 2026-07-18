import { authHeader } from './authStorage';

const BASE_URL = 'http://localhost:8000/api/institutions';

export const getAllInstitutions = async () => {
  const res = await fetch(`${BASE_URL}/`, {
    credentials: 'include',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch institutions');
  return res.json();
};

export const getInstitutionById = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}/`, {
    credentials: 'include',
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error('Institution not found');
  return res.json();
};

export const createInstitution = async (formData) => {
  const res = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeader() },
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
    headers: { ...authHeader() },
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
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const registerInstitution = async (formData) => {
  const res = await fetch(`${BASE_URL}/register/`, {
    method: 'POST',
    body: formData, // public endpoint — no auth header/cookie needed
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const setInstitutionStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/${id}/status/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
};