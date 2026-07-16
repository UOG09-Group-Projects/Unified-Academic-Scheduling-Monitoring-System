import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../auth/services/authService';
import AuthShell from '../auth/AuthShell';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { usePermissions } from '../auth/PermissionsContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = usePermissions();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login(form.email, form.password);
      setUser(user);

      const role = user.role.toLowerCase();
      const routes = {
        owner: '/dashboard/owner',
        super_admin: '/dashboard/super-admin',
        manager: '/dashboard/manager',
        educator: '/dashboard/educator',
        student: '/dashboard/student',
        parent: '/dashboard/parent',
      };
      navigate(routes[role] || '/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="LightLearn" subtitle="Sign in to your account">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-danger rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full mt-1">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-ocean-700 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="text-center text-xs text-ink-faint mt-6">
        New student?{' '}
        <Link to="/signup/student" className="text-ocean-700 hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
