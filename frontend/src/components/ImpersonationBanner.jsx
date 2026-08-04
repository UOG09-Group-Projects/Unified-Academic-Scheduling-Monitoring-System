import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import { usePermissions } from '../auth/PermissionsContext';
import { getImpersonationExpiry } from '../services/authStorage';

function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function ImpersonationBanner() {
  const { user, stopImpersonation } = usePermissions();
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const expiresAt = getImpersonationExpiry();
    if (!expiresAt) return undefined;

    const tick = () => setRemaining(expiresAt.getTime() - Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2 bg-amber-500 text-white text-sm font-medium shadow-sm">
      <span className="flex items-center gap-2 min-w-0">
        <Eye size={15} className="shrink-0" />
        <span className="truncate">
          Viewing as <strong>{user?.impersonation_target?.username}</strong> ({user?.role}) — impersonated by {user?.real_admin?.username}
        </span>
        {remaining != null && (
          <span className="shrink-0 tabular-nums opacity-90">· exits in {formatCountdown(remaining)}</span>
        )}
      </span>
      <button
        onClick={stopImpersonation}
        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
      >
        <X size={13} /> Exit impersonation
      </button>
    </div>
  );
}
