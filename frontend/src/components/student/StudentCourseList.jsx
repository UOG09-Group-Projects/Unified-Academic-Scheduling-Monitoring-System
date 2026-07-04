// src/components/student/StudentCourseList.jsx
import { useState } from 'react';
import EducatorInlineDetail from './EducatorInlineDetail';

export default function StudentCourseList({ courses }) {
  const [expanded, setExpanded] = useState(null);
  // { courseId, educatorId, educatorName }

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
      <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#6B7280] mb-2.5">
        Your Courses
      </p>

      {courses.length === 0 ? (
        <div className="bg-[#1A1D26] border border-[#2A2D3A] rounded-xl p-6 text-center">
          <p className="text-[13px] text-[#6B7280]">No courses found for your batch.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {courses.map(course => (
            <div
              key={course.id}
              className="bg-[#1A1D26] border border-[#2A2D3A] rounded-xl p-5"
            >
              {/* Course info */}
              <p className="text-[15px] font-semibold text-[#F0F2F8]">
                {course.name}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {course.code} · {course.institution}
              </p>

              {/* Educator chips */}
              {course.educators?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {course.educators.map(edu => {
                    const isActive =
                      expanded?.courseId === course.id &&
                      expanded?.educatorId === edu.id;

                    return (
                      <button
                        key={edu.id}
                        onClick={() => toggleEducator(course.id, edu)}
                        className={`
                          px-3 py-1.5 rounded-lg border text-xs font-medium
                          cursor-pointer flex items-center gap-1.5 transition-all duration-100
                          ${isActive
                            ? 'border-[#2B4EFF] bg-[#2B4EFF]/10 text-[#2B4EFF]'
                            : 'border-[#2A2D3A] bg-[#A78BFA]/10 text-[#A78BFA] hover:border-[#A78BFA]/40'
                          }
                        `}
                      >
                        {edu.name}
                        <svg
                          className={`w-2.5 h-2.5 opacity-60 transition-transform duration-150
                                     ${isActive ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Inline educator detail */}
              {expanded?.courseId === course.id && (
                <EducatorInlineDetail
                  educatorId={expanded.educatorId}
                  educatorName={expanded.educatorName}
                  onClose={() => setExpanded(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}