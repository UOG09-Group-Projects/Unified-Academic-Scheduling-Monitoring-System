import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const PermissionsContext = createContext(null);

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')) ?? null; }
  catch { return null; }
}

export function PermissionsProvider({ children }) {
  const [user, setUserState] = useState(readStoredUser);

  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) localStorage.setItem('user', JSON.stringify(u));
  }, []);

  const refresh = useCallback(() => {
    if (!localStorage.getItem('user')) return;
    api.get('/auth/me/')
      .then((res) => setUser(res.data.user))
      .catch(() => {});
  }, [setUser]);

  // Pick up fresh permissions once per app load (covers role/permission
  // changes made server-side since this session's user object was cached).
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const can = useCallback((permission) => {
    if (!user) return false;
    if (user.permissions === 'ALL') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }, [user]);

  return (
    <PermissionsContext.Provider value={{ user, can, setUser, refresh }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within a PermissionsProvider');
  return ctx;
}
