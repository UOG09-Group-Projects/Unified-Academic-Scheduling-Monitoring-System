import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../auth/services/authService';
import AuthShell from '../auth/AuthShell';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { usePermissions } from '../auth/PermissionsContext';

const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = usePermissions();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Verifying logs the student straight in — their institution's
      // approval status still gates real access (see DashboardLayout),
      // but there's no separate login step re-asking for credentials.
      const user = await authService.verifyStudentOtp({ email, code });
      setUser(user);
      navigate('/dashboard/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError(null);
    setResending(true);
    try {
      await authService.resendStudentOtp(email);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Enter the code we sent to your inbox">
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-danger rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Verification code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          required
        />

        <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full mt-1">
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !email}
          className="text-sm text-ocean-700 hover:underline disabled:text-ink-faint disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
        </button>
      </form>

      <p className="text-center text-xs text-ink-faint mt-6">
        <Link to="/login" className="text-ocean-700 hover:underline">Back to login</Link>
      </p>
    </AuthShell>
  );
}
