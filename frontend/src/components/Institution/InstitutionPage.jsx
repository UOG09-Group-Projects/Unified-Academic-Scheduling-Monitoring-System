import { useState, useEffect} from 'react';
import InstitutionForm from './InstitutionForm';
import InstitutionTable from './InstitutionTable';
import ViewInstitutionModal from './ViewInstitutionModal';
import { getAllInstitutions, deleteInstitution } from '../../services/institutionService';

const InstitutionPage = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [viewInstitution, setViewInstitution] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // Fetch institutions
  // =========================
  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const data = await getAllInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);

    try {
      const data = await getAllInstitutions();
      setInstitutions(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // =========================
  // Delete from table
  // =========================
  const handleTableDelete = async (id) => {
    const confirmed = window.confirm('Soft delete this institution?');
    if (!confirmed) return;

    try {
      await deleteInstitution(id);
      fetchInstitutions();

      setSelectedInstitution((prev) =>
        prev?.id === id ? null : prev
      );
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-medium text-gray-800 pb-4 mb-5 border-b border-gray-200">
        Institution Management
      </h1>

      {/* FORM */}
      <InstitutionForm
        key={selectedInstitution?.id ?? 'new'}
        selectedInstitution={selectedInstitution}
        onSuccess={fetchInstitutions}
        onClearSelection={() => setSelectedInstitution(null)}
        />

      {/* TABLE */}
      <hr className="my-6 border-gray-200" />

      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
        Institution list
      </h2>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-6">
            Loading...
          </div>
        ) : (
          <InstitutionTable
            institutions={institutions}
            onView={(inst) => setViewInstitution(inst)}
            onEdit={(inst) => setSelectedInstitution(inst)}
            onDelete={handleTableDelete}
          />
        )}
      </div>

      {/* MODAL */}
      {viewInstitution && (
        <ViewInstitutionModal
          institution={viewInstitution}
          onClose={() => setViewInstitution(null)}
        />
      )}
    </div>
  );
};

export default InstitutionPage;