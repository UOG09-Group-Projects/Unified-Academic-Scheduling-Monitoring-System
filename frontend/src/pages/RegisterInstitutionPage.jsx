import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { registerInstitution } from '../services/institutionService';
import AuthShell from '../auth/AuthShell';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import ImageUpload from '../components/Institution/ImageUpload';
import OwnerForm from '../components/Institution/OwnerForm';

export default function RegisterInstitutionPage() {
  const [fields, setFields] = useState({
    name: '', username: '', email: '', password: '', confirm_password: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (file) => {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fields.name.trim()) return setError('Institution name is required.');
    if (fields.password !== fields.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', fields.name);
      fd.append('username', fields.username);
      fd.append('email', fields.email);
      fd.append('password', fields.password);
      fd.append('confirm_password', fields.confirm_password);
      if (logoFile) fd.append('logo', logoFile);

      await registerInstitution(fd);
      setSubmitted(true);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message);
        setError(Object.values(parsed).flat().join(' ') || 'Could not submit registration.');
      } catch {
        setError('Could not submit registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell title="Registration submitted" subtitle="Thanks for registering your institution">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 py-6"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <p className="text-sm text-ink-soft max-w-sm">
            A super admin will review your registration shortly. You'll be able to sign in
            as soon as it's approved.
          </p>
          <Link to="/login" className="text-sm text-ocean-700 hover:underline">Back to sign in</Link>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Register your institution" subtitle="Submit your details for super admin review">
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
          label="Institution name"
          type="text"
          name="name"
          value={fields.name}
          onChange={handleChange}
          placeholder="Riverside Academy"
          required
        />

        <ImageUpload preview={logoPreview} onImageChange={handleImageChange} onClear={handleClearImage} />

        <OwnerForm values={fields} onChange={handleChange} />

        <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full mt-1">
          {loading ? 'Submitting…' : 'Submit registration'}
        </Button>
      </form>

      <p className="text-center text-xs text-ink-faint mt-6">
        Already approved?{' '}
        <Link to="/login" className="text-ocean-700 hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
