import { useState, useEffect, useCallback } from "react";
import { enrollmentAPI } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { UserPlus, Trash2, Search, Loader2 } from "lucide-react";

const EnrollmentManagement = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ courses_id: "" });

  // ✅ SAFE USER
  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const currentUser = getCurrentUser();
  const currentStudentId = currentUser?.student_id || currentUser?.id;

  // ✅ FETCH DATA
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [enrollRes, dropRes] = await Promise.all([
        enrollmentAPI.getAll(),
        enrollmentAPI.getDropdownData(),
      ]);

      const all = enrollRes.data?.results || enrollRes.data || [];

      const myEnroll = all.filter((e) => {
        const studentValue = e.student ?? e.students_id ?? e.student_id;
        return Number(studentValue) === Number(currentStudentId);
      });

      const student = dropRes.data?.students?.find(
        (s) => Number(s.id) === Number(currentStudentId)
      );

      setEnrollments(myEnroll);
      setCourses(dropRes.data?.courses || []);
      setStudentProfile(student || null);
    } catch (err) {
      toast.error("Load failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentStudentId]);

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!currentStudentId) {
        toast.error("Login as student");
        return;
      }

      try {
        await fetchData();
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [currentStudentId, fetchData]);

  // ✅ CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.courses_id) {
      return toast.error("Select course");
    }

    try {
      setSubmitting(true);

      await enrollmentAPI.create({
        student: Number(currentStudentId),
        course: Number(formData.courses_id),
      });

      toast.success("Enrolled!");
      setShowModal(false);
      setFormData({ courses_id: "" });
      fetchData();
    } catch {
      toast.error("Error enrolling");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    try {
      await enrollmentAPI.delete(id);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ✅ FILTER
  const filtered = enrollments.filter((e) => {
    const courseName = e.course_name || e.course?.name || "";
    const courseCode = e.course_code || e.course?.code || "";
    const term = searchTerm.toLowerCase();

    return (
      courseName.toLowerCase().includes(term) ||
      courseCode.toLowerCase().includes(term)
    );
  });

  const availableCourses = courses.filter((c) => {
    const enrolledCourseIds = enrollments.map((e) => {
      const rawCourseId = e.course ?? e.courses_id ?? e.course_id;
      return rawCourseId && typeof rawCourseId === "object" ? rawCourseId.id : rawCourseId;
    });

    return !enrolledCourseIds.includes(Number(c.id));
  });

  // ❌ NOT LOGIN
  if (!currentStudentId) {
    return <div className="p-10 text-center">Login Required</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster />

      {/* PROFILE */}
      {studentProfile && (
        <div className="bg-blue-600 text-white p-5 rounded-xl mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{studentProfile.name}</h2>
            <p className="text-sm">{studentProfile.email}</p>
          </div>
          <p className="text-2xl font-bold">ID: {studentProfile.id}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">My Enrollments</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          <UserPlus size={18} /> Add
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search className="absolute top-3 left-3" size={18} />
        <input
          type="text"
          className="pl-10 p-2 border w-full rounded"
          placeholder="Search..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow">
        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Course</th>
                <th className="p-3">Code</th>
                <th className="p-3">Date</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3">{e.course_name || e.course?.name || "—"}</td>
                    <td className="p-3">{e.course_code || e.course?.code || "—"}</td>
                    <td className="p-3">
                      {e.created_at ? new Date(e.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    No enrollments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-5 rounded w-96">
            <h2 className="text-lg font-bold mb-3">Enroll Course</h2>

            <form onSubmit={handleSubmit}>
              <select
                className="w-full border p-2 mb-4"
                value={formData.courses_id}
                onChange={(e) =>
                  setFormData({ courses_id: e.target.value })
                }
              >
                <option value="">Select course</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                  {submitting ? "Loading..." : "Enroll"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded w-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;