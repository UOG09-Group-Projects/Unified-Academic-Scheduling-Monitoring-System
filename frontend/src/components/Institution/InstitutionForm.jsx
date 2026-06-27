// src/components/Institution/InstitutionForm.jsx

import { useState } from 'react';
import { CheckCircle, XCircle, X, Trash2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import OwnerForm from './OwnerForm';
import {
  createInstitution,
  updateInstitution,
  deleteInstitution,
} from '../../services/institutionService';

// =========================
// Toast Component
// =========================
const Toast = ({ message, type, onClose }) => {
  useState(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const styles = isSuccess
    ? 'bg-green-50 border-green-300 text-green-700'
    : 'bg-red-50 border-red-300 text-red-700';
  const Icon = isSuccess ? CheckCircle : XCircle;
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${styles}`}>
      <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// =========================
// Confirm Delete Modal
// =========================
const ConfirmDeleteModal = ({ name, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[380px] max-w-[95vw] p-6">

        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>

        {/* Text */}
        <h3 className="text-center text-base font-semibold text-gray-800 mb-1">
          Delete Institution
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-medium text-gray-700">"{name}"</span>?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================
// Main Form
// =========================
const InstitutionForm = ({ selectedInstitution, onSuccess, onClearSelection }) => {

  const [fields, setFields] = useState({
    name: selectedInstitution?.name || '',
    username: selectedInstitution?.owner?.username || '',
    email: selectedInstitution?.owner?.email || '',
    password: '',
    confirm_password: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(
    selectedInstitution?.logo || null
  );
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);

  // =========================
  // Handlers
  // =========================
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

  // =========================
  // Validation
  // =========================
  const validate = () => {
    if (!fields.name.trim())     return 'Institution name is required';
    if (!fields.username.trim()) return 'Username is required';
    if (!fields.email.trim())    return 'Email is required';
    if (!selectedInstitution && !fields.password) return 'Password is required';
    if (fields.password !== fields.confirm_password) return 'Passwords do not match';
    return null;
  };

  // =========================
  // Build FormData
  // =========================
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

  // =========================
  // Insert
  // =========================
  const handleInsert = async () => {
    const err = validate();
    if (err) return showToast(err, 'error');

    try {
      await createInstitution(buildFormData());
      showToast('Institution created successfully!', 'success');
      onSuccess();
      onClearSelection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // =========================
  // Update
  // =========================
  const handleUpdate = async () => {
    if (!selectedInstitution) return showToast('No institution selected for update.', 'error');
    const err = validate();
    if (err) return showToast(err, 'error');

    try {
      await updateInstitution(selectedInstitution.id, buildFormData());
      showToast('Institution updated successfully!', 'success');
      onSuccess();
      onClearSelection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // =========================
  // Delete — opens modal first
  // =========================
  const handleDelete = () => {
    if (!selectedInstitution) return showToast('No institution selected for deletion.', 'error');
    setShowDeleteModal(true); // show custom modal instead of window.confirm
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      await deleteInstitution(selectedInstitution.id);
      showToast('Institution deleted successfully.', 'success');
      onSuccess();
      onClearSelection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          name={selectedInstitution?.name}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">

        {/* Institution Info */}
        <div className="mb-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
            Institution Management
          </h3>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={handleChange}
              placeholder="Institution Name"
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:border-blue-400"
            />
          </div>

          <ImageUpload
            preview={logoPreview}
            onImageChange={handleImageChange}
            onClear={handleClearImage}
          />
        </div>

        {/* Owner Details */}
        <OwnerForm values={fields} onChange={handleChange} />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-200">
          <button
            onClick={handleInsert}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Insert
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-200"
          >
            Update
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
};

export default InstitutionForm;