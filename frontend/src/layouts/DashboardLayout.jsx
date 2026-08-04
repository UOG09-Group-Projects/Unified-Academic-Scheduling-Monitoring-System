import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useTheme } from '../hooks/useTheme';
import { ToastProvider } from '../components/ui/Toast';
import { usePermissions } from '../auth/PermissionsContext';
import authService from '../auth/services/authService';
import Button from '../components/ui/Button';
import ImpersonationBanner from '../components/ImpersonationBanner';
import ImpersonationPreview from '../components/ImpersonationPreview';

// Picked in JS rather than via a `dark:` variant override on the gradient's
// last stop — that relies on CSS cascade/specificity behavior between two
// classes targeting the same custom property, which is easy to get subtly
// wrong. Branching the whole class string here is unambiguous.
//
// Uses `paper`/`paper-soft` (the background tokens — dark in dark mode), not
// `ink` (the foreground/text token, which is deliberately near-white in dark
// mode so text stays readable — using it here previously rendered the
// "dark" gradient as off-white).
const GRADIENT = {
  light: 'bg-gradient-to-br from-paper via-paper-soft to-brand-50',
  dark:  'bg-gradient-to-br from-paper via-paper-soft to-brand-900',
};

// A student who just verified their signup OTP now holds a valid session
// before their institution has approved them (see students/views.py
// StudentVerifyOtpView) — the backend blocks every protected API call for
// them until approved (institutions/access.py::student_access_block), so
// the dashboard itself needs to show that state rather than a broken/empty
// page full of failed requests.
const STUDENT_GATE_COPY = {
  PENDING: {
    title: 'Awaiting approval',
    message: "Your account is verified, but your institution hasn't approved it yet. You'll get full access as soon as they do.",
  },
  REJECTED: {
    title: 'Registration rejected',
    message: 'Your institution rejected this registration. Contact them directly if you think this is a mistake.',
  },
};

function StudentGateScreen({ status }) {
  const copy = STUDENT_GATE_COPY[status] || STUDENT_GATE_COPY.PENDING;
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-ink">{copy.title}</h1>
        <p className="text-sm text-ink-faint">{copy.message}</p>
        <Button variant="outline" size="md" onClick={authService.logout}>
          Log out
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { theme } = useTheme();
  const { user, isImpersonating } = usePermissions();

  const studentGateStatus =
    user?.role?.toUpperCase?.() === 'STUDENT' && user.student_status && user.student_status !== 'APPROVED'
      ? user.student_status
      : null;

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <ToastProvider>
        {studentGateStatus ? (
          <StudentGateScreen status={studentGateStatus} />
        ) : (
          <div className={`flex h-screen ${GRADIENT[theme]}`}>
            <Sidebar />
            <main className="flex-1 overflow-y-auto scroll-thin md:ml-64 pt-14 md:pt-0 flex flex-col">
              {isImpersonating && <ImpersonationBanner />}
              <Topbar />
              <div className="flex-1">
                {isImpersonating ? <ImpersonationPreview role={user?.role} /> : <Outlet />}
              </div>
            </main>
          </div>
        )}
      </ToastProvider>
    </div>
  );
}
