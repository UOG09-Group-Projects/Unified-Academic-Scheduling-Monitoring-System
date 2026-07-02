import { useState, useEffect } from 'react';
import CourseForm from "./CourseForm";
import CourseTable from "./CourseTable";
import courseService from "../../services/courseService";
import lookupService from "../../services/lookupService";

export default function CoursePage() {
  const [courses, setCourses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allEducators, setAllEducators] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch courses whenever the search term changes (or on mount).
  // Logic lives directly inside the effect with an `ignore` flag to guard
  // against race conditions / setting state after unmount or after a newer
  // search has already started.
  useEffect(() => {
    let ignore = false;

    async function loadCourses() {
      try {
        const data = await courseService.list(search);
        if (!ignore) setCourses(data);
      } catch {
        if (!ignore) showToast('Failed to load courses.', 'error');
      }
    }

    loadCourses();

    return () => { ignore = true; };
  }, [search]);

  // Load institutions, batches, educators once on mount
  useEffect(() => {
    let ignore = false;

    async function loadDropdowns() {
      try {
        const [institutionsData, batchesData, educatorsData] = await Promise.all([
          lookupService.listInstitutions(),
          lookupService.listBatches(),
          lookupService.listEducators(),
        ]);
        if (ignore) return;
        setInstitutions(institutionsData);
        setAllBatches(batchesData);
        setAllEducators(educatorsData);
      } catch {
        if (!ignore) showToast('Failed to load form data.', 'error');
      }
    }

    loadDropdowns();

    return () => { ignore = true; };
  }, []);

  // Reusable refetch for after insert/update/delete (a normal event-driven
  // call, not inside an effect, so this is unaffected by the lint rule)
  const refetchCourses = async () => {
    try {
      const data = await courseService.list(search);
      setCourses(data);
    } catch {
      showToast('Failed to refresh course list.', 'error');
    }
  };

  const handleInsert = async (payload) => {
    try {
      await courseService.create(payload);
      showToast('Course created successfully!');
      await refetchCourses();
      setSelectedCourse(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Insert failed.', 'error');
    }
  };

  const handleUpdate = async (id, payload) => {
    if (!id) return showToast('Select a course to update.', 'error');
    try {
      await courseService.update(id, payload);
      showToast('Course updated successfully!');
      await refetchCourses();
      setSelectedCourse(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await courseService.remove(id);
      showToast('Course deleted.');
      await refetchCourses();
      setSelectedCourse(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-medium text-gray-800 pb-4 mb-5 border-b border-gray-200">Course Management</h1>
        

        <div className="mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Course Name or Code"
            className="w-full border rounded px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <CourseForm
          key={`${selectedCourse?.id ?? 'new'}-${allBatches.length}-${allEducators.length}`}
          selectedCourse={selectedCourse}
          institutions={institutions}
          allBatches={allBatches}
          allEducators={allEducators}
          onInsert={handleInsert}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClear={() => setSelectedCourse(null)}
        />

        <CourseTable
          courses={courses}
          onEdit={(course) => setSelectedCourse(course)}
          onView={(course) => setViewCourse(course)}
        />
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {viewCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1">{viewCourse.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Code: {viewCourse.code} | {viewCourse.institution_name}</p>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Batches</p>
              <div className="flex flex-wrap gap-1">
                {viewCourse.batches.map(b => (
                  <span key={b.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                    {b.batch_name}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Educators</p>
              <div className="flex flex-wrap gap-1">
                {viewCourse.educators.map(e => (
                  <span key={e.id} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    {e.educator_name}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setViewCourse(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}