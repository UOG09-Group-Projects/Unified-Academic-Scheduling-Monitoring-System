import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(() =>
    token ? 'verifying' : 'error'
  );

  const [message, setMessage] = useState(() =>
    token ? '' : 'Invalid verification link.'
  );

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await axios.post(
          'http://localhost:8000/api/auth/verify-email/',
          { token }
        );

        setMessage(res.data.message);
        setStatus('success');
      } catch (err) {
        setMessage(
          err.response?.data?.error ||
          'Verification failed. The link may be invalid.'
        );
        setStatus('error');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">

        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center
                            justify-center mx-auto mb-4 animate-pulse">
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Verifying your email...
            </h1>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Email Verified!
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link to="/login"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700
                         text-white font-medium rounded-lg text-sm transition-colors">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center
                            justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Verification Failed
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link to="/login"
              className="text-blue-600 hover:underline text-sm">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}