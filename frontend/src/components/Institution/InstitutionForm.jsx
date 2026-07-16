// src/components/Institution/InstitutionForm.jsx
import { useState } from 'react';
import ImageUpload from './ImageUpload';
import OwnerForm from './OwnerForm';
import { createInstitution, updateInstitution } from '../../services/institutionService';
import { Input } from '../ui/Field';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const InstitutionForm = ({ selectedInstitution, onSuccess, onCancel }) => {
  const [fields, setFields] = useState({
    name: selectedInstitution?.name || '',
    username: selectedInstitution?.owner?.username || '',
    email: selectedInstitution?.owner?.email || '',
    password: '',
    confirm_password: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(selectedInstitution?.logo || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

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

  const validate = () => {
    if (!fields.name.trim())     return 'Institution name is required';
    if (!fields.username.trim()) return 'Username is required';
    if (!fields.email.trim())    return 'Email is required';
    if (!selectedInstitution && !fields.password) return 'Password is required';
    if (fields.password !== fields.confirm_password) return 'Passwords do not match';
    return null;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('name', fields.name);
    fd.append('username', fields.username);
    fd.append('email', fields.email);
    fd.append('password', fields.password || '');
    fd.append('confirm_password', fields.confirm_password || '');
    if (logoFile) fd.append('logo', logoFile);
    return fd;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return setError(err);

    setSaving(true);
    setError('');
    try {
      if (selectedInstitution) {
        await updateInstitution(selectedInstitution.id, buildFormData());
        toast.success('Institution updated successfully!');
      } else {
        await createInstitution(buildFormData());
        toast.success('Institution created successfully!');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Input
        label="Institution name"
        name="name"
        required
        value={fields.name}
        onChange={handleChange}
        placeholder="Institution name"
      />

      <ImageUpload preview={logoPreview} onImageChange={handleImageChange} onClear={handleClearImage} />

      <OwnerForm
        values={fields}
        onChange={handleChange}
        passwordHint={selectedInstitution ? 'Leave blank to keep current password' : undefined}
      />

      {error && <p className="text-sm text-danger break-words">{error}</p>}

      <div className="flex gap-3 pt-4 border-t border-ink/[0.06]">
        <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
        <Button variant="brand" size="md" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : selectedInstitution ? 'Save changes' : 'Create institution'}
        </Button>
      </div>
    </div>
  );
};

export default InstitutionForm;
