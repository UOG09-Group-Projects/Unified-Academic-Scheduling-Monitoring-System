import { authHeader } from './authStorage';

const BASE_URL = 'http://localhost:8000/api/institutions';

export async function fetchRoles() {
  const res = await fetch(`${BASE_URL}/roles/`, { credentials: "include", headers: { ...authHeader() } });
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function fetchPermissions() {
  const res = await fetch(`${BASE_URL}/permissions/`, { credentials: "include", headers: { ...authHeader() } });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json();
}

export async function createRole(payload) {
  // payload: { name: string, permissions: number[] }
  const res = await fetch(`${BASE_URL}/roles/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create role");
  return data;
}

export async function updateRole(id, payload) {
  const res = await fetch(`${BASE_URL}/roles/${id}/`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update role");
  return data;
}

export async function deleteRole(id) {
  const res = await fetch(`${BASE_URL}/roles/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...authHeader() },
  });
  if (!res.ok) throw new Error("Failed to delete role");
  return res.json();
}
