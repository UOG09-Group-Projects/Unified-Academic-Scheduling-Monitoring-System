// src/components/student/StudentCourseList.jsx

import { useState } from 'react';
import EducatorInlineDetail from './EducatorInlineDetail';

export default function StudentCourseList({ courses }) {
  const [expanded, setExpanded] = useState(null);

  const toggleEducator = (courseId, educator) => {
    if (expanded?.courseId === courseId && expanded?.educatorId === educator.id) {
      setExpanded(null);
    } else {
      setExpanded({
        courseId,
        educatorId: educator.id,
        educatorName: educator.name,
      });
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
        Your Courses
      </p>

      {courses.length === 0 ? (
        <div className="rounded-xl border bg-gray-50 p-6 text-center text-sm text-gray-500">
          No courses found for your batch.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map(course => (
            <div
              key={course.id}
              className="rounded-xl border bg-white p-5"
            >
              {/* Course info */}
              <p className="text-base font-semibold text-gray-900">
                {course.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {course.code} · {course.institution}
              </p>

              {/* Educators */}
              {course.educators?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {course.educators.map(edu => {
                    const isActive =
                      expanded?.courseId === course.id &&
                      expanded?.educatorId === edu.id;

                    return (
                      <button
                        key={edu.id}
                        onClick={() => toggleEducator(course.id, edu)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition
                          ${isActive
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                        {edu.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Expanded educator */}
              {expanded?.courseId === course.id && (
                <div className="mt-4">
                  <EducatorInlineDetail
                    educatorId={expanded.educatorId}
                    educatorName={expanded.educatorName}
                    onClose={() => setExpanded(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}