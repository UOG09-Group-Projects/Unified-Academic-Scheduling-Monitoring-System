import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import authService from '../auth/services/authService';
import AuthShell from '../auth/AuthShell';
import { Input, Select } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { usePermissions } from '../auth/PermissionsContext';

export default function StudentSignupPage() {
  const navigate = useNavigate();
  const { setUser } = usePermissions();

  const [institutions, setInstitutions] = useState([]);
  const [institutionsError, setInstitutionsError] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', institutionId: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.listPublicInstitutions()
      .then(setInstitutions)
      .catch(() => setInstitutionsError(true));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.studentSignup({
        name: form.name,
        email: form.email,
        password: form.password,
        institutionId: form.institutionId,
      });
      setUser(user);
      navigate('/dashboard/student');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Could not create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your student account" subtitle="Sign up and pick the institution you're enrolling in">
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
          label="Full name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          required
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />
        <Select
          label="Institution"
          name="institutionId"
          value={form.institutionId}
          onChange={handleChange}
          required
        >
          <option value="" disabled>
            {institutionsError ? 'Could not load institutions' : 'Select your institution'}
          </option>
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>{inst.name}</option>
          ))}
        </Select>
        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          minLength={8}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          minLength={8}
          required
        />

        <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full mt-1">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-xs text-ink-faint mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-ocean-700 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
