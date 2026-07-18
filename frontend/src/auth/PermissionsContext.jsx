import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { getStoredUser, setStoredUser } from '../services/authStorage';

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [user, setUserState] = useState(getStoredUser);

  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) setStoredUser(u);
  }, []);

  const refresh = useCallback(() => {
    if (!getStoredUser()) return;
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
