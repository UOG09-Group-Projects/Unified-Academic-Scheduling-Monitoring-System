import { useState, useEffect } from 'react';
import StudentForm from "../components/StudentForm";
import StudentTable from '../components/StudentTable';
import ViewStudentModal from '../components/ViewStudentModal';
import studentService from "../services/studentService";
import batchService from '../services/batchService';

const StudentPage = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // Fetch batches
  // =========================
  const fetchBatches = async () => {
  try {
    const data = await batchService.getAll();
    setBatches(data);
  } catch (err) {
    console.error('Batch fetch error:', err);
  }
};

  // =========================
  // Fetch students
  // =========================
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.list();
      setStudents(data);
    } catch (err) {
      console.error('Student fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchStudents();
  }, []);

  // =========================
  // CRUD handlers
  // =========================
  const handleInsert = async (payload) => {
    try {
      await studentService.create(payload);
      fetchStudents();
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Insert failed');
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return alert('Select a student first');

    try {
      await studentService.update(id, payload);
      fetchStudents();
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this student?");
    if (!confirmDelete) return;

    try {
      await studentService.remove(id);
      fetchStudents();
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleView = async (student) => {
    try {
      const full = await studentService.getById(student.id);
      setViewStudent(full);
    } catch {
      alert('Failed to load student details');
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-4xl mx-auto p-6">

      {/* HEADER */}
      <h1 className="text-xl font-medium text-gray-800 pb-4 mb-5 border-b border-gray-200">
        Student Management
      </h1>

      {/* FORM */}
      <StudentForm
        key={selectedStudent?.id ?? 'new'}
        selectedStudent={selectedStudent}
        batches={batches}
        onInsert={handleInsert}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onClear={() => setSelectedStudent(null)}
      />

      {/* TABLE SECTION */}
      <hr className="my-6 border-gray-200" />

      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
        Student list
      </h2>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-6">
            Loading...
          </div>
        ) : (
          <StudentTable
            students={students}
            onEdit={setSelectedStudent}
            onView={handleView}
          />
        )}
      </div>

      {/* MODAL */}
      {viewStudent && (
        <ViewStudentModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
        />
      )}
    </div>
  );
};

export default StudentPage;