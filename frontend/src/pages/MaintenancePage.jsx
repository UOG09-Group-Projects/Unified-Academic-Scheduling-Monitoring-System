import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { usePermissions } from '../auth/PermissionsContext';

// Shown when PlatformSettings.maintenance_mode is on and the current user
// isn't SUPER_ADMIN — see institutions/middleware.py::MaintenanceModeMiddleware,
// which is the actual enforcement; this is just a clean message instead of
// scattered request failures for whoever's already looking at the app.
export default function MaintenancePage() {
  const { platformInfo } = usePermissions();

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-soft p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-sm text-center space-y-4"
      >
        <div className="w-14 h-14 rounded-3xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center mx-auto text-brand-700 dark:text-brand-300">
          <Wrench size={22} />
        </div>
        <h1 className="text-xl font-semibold text-ink">
          {platformInfo?.platform_name || 'The platform'} is under maintenance
        </h1>
        <p className="text-sm text-ink-faint">
          We're making some changes. Please check back shortly.
        </p>
        {platformInfo?.support_email && (
          <p className="text-xs text-ink-faint">
            Questions? <a href={`mailto:${platformInfo.support_email}`} className="text-brand-600 hover:underline">{platformInfo.support_email}</a>
          </p>
        )}
      </motion.div>
    </div>
  );
}
