import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import AuthShell from './AuthShell';
import Button from '../components/ui/Button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(() => (token ? 'verifying' : 'error'));
  const [message, setMessage] = useState(() => (token ? '' : 'Invalid verification link.'));

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await axios.post('http://localhost:8000/api/auth/verify-email/', { token });
        setMessage(res.data.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid.');
        setStatus('error');
      }
    }

    verify();
  }, [token]);

  const ICONS = {
    verifying: { icon: Mail, tone: 'bg-ocean-50 text-ocean-700', pulse: true },
    success: { icon: CheckCircle2, tone: 'bg-emerald-50 text-success', pulse: false },
    error: { icon: XCircle, tone: 'bg-red-50 text-danger', pulse: false },
  };
  const { icon: Icon, tone, pulse } = ICONS[status];

  const TITLES = {
    verifying: 'Verifying your email…',
    success: 'Email verified!',
    error: 'Verification failed',
  };

  return (
    <AuthShell title="">
      <div className="text-center -mt-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${tone} ${pulse ? 'animate-pulse' : ''}`}>
          <Icon size={26} />
        </div>
        <h1 className="text-xl font-display font-bold text-ink mb-2">{TITLES[status]}</h1>
        <p className="text-sm text-ink-faint mb-6">{message || 'Please wait a moment.'}</p>

        {status !== 'verifying' && (
          <Button as={Link} to="/login" variant={status === 'success' ? 'ocean' : 'outline'} size="md">
            {status === 'success' ? 'Go to login' : 'Back to login'}
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
