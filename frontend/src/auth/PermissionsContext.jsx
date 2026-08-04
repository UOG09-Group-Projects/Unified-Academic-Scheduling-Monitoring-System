import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import platformSettingsService from '../services/platformSettingsService';
import impersonationService from '../services/impersonationService';
import {
  getStoredUser, setStoredUser, startImpersonation as storeStartImpersonation,
  stopImpersonation as storeStopImpersonation, isImpersonating as storedIsImpersonating,
  getImpersonationExpiry,
} from '../services/authStorage';

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [user, setUserState] = useState(getStoredUser);
  const [platformInfo, setPlatformInfo] = useState(null);
  const impersonationTimerRef = useRef(null);

  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) setStoredUser(u);
  }, []);

  // `/auth/me/` always resolves through whatever token is active — during an
  // impersonation session that's the target's real record (kept real
  // server-side for the audit trail). Sanitize it the same way
  // startImpersonation does below, or a page refresh mid-session would
  // silently repopulate the real username/email into the dashboard chrome.
  const sanitizeIfImpersonating = useCallback((fresh) => {
    if (!fresh?.impersonating) return fresh;
    return {
      ...fresh,
      username: 'Preview Account',
      email: 'preview@example.com',
      impersonation_target: { username: fresh.username, email: fresh.email },
    };
  }, []);

  const refresh = useCallback(() => {
    if (!getStoredUser()) return;
    api.get('/auth/me/')
      .then((res) => setUser(sanitizeIfImpersonating(res.data.user)))
      .catch(() => {});
  }, [setUser, sanitizeIfImpersonating]);

  // Pick up fresh permissions once per app load (covers role/permission
  // changes made server-side since this session's user object was cached).
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Public, unauthenticated — safe to fetch before login, drives the
  // maintenance-mode gate in App.jsx and document.title below.
  useEffect(() => {
    platformSettingsService.getPublic()
      .then(setPlatformInfo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (platformInfo?.platform_name) document.title = platformInfo.platform_name;
  }, [platformInfo]);

  const clearImpersonationTimer = useCallback(() => {
    if (impersonationTimerRef.current) {
      clearTimeout(impersonationTimerRef.current);
      impersonationTimerRef.current = null;
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    clearImpersonationTimer();
    impersonationService.stop().catch(() => {}); // best-effort audit log
    storeStopImpersonation();
    refresh(); // resync `user` from the restored admin token
  }, [clearImpersonationTimer, refresh]);

  const scheduleAutoStop = useCallback((expiresAt) => {
    clearImpersonationTimer();
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) { stopImpersonation(); return; }
    impersonationTimerRef.current = setTimeout(stopImpersonation, ms);
  }, [clearImpersonationTimer, stopImpersonation]);

  const startImpersonation = useCallback(async (email) => {
    const data = await impersonationService.start(email);
    const sanitizedUser = sanitizeIfImpersonating(data.user);
    storeStartImpersonation({
      user: sanitizedUser,
      access: data.access,
      expiresAt: data.impersonation_expires_at,
    });
    setUser(sanitizedUser);
    scheduleAutoStop(data.impersonation_expires_at);
    return data.user;
  }, [setUser, scheduleAutoStop, sanitizeIfImpersonating]);

  // A page refresh loses any in-memory timer — if sessionStorage says an
  // impersonation session is already active (and not yet expired), pick the
  // countdown back up on mount instead of leaving it unbounded until the
  // JWT's own server-side expiry eventually 401s a request.
  useEffect(() => {
    if (storedIsImpersonating()) {
      const expiresAt = getImpersonationExpiry();
      if (expiresAt) scheduleAutoStop(expiresAt);
    }
    return clearImpersonationTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const can = useCallback((permission) => {
    if (!user) return false;
    if (user.permissions === 'ALL') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  }, [user]);

  const isImpersonating = Boolean(user?.impersonating);

  return (
    <PermissionsContext.Provider value={{
      user, can, setUser, refresh, platformInfo,
      isImpersonating, startImpersonation, stopImpersonation,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within a PermissionsProvider');
  return ctx;
}
