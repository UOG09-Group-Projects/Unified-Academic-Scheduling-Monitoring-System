import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import EducatorInlineDetail from './EducatorInlineDetail';
import CourseActivityProgress from '../activities/CourseActivityProgress';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { BookOpen } from 'lucide-react';

export default function StudentCourseList({ courses, progressRecords, studentId, onProgressChange }) {
  const [expanded, setExpanded] = useState(null);

  const toggleEducator = (courseId, educator) => {
    if (expanded?.courseId === courseId && expanded?.educatorId === educator.id) {
      setExpanded(null);
    } else {
      setExpanded({ courseId, educatorId: educator.id, educatorName: educator.name });
    }
  };

  if (courses.length === 0) {
    return (
      <Card>
        <EmptyState icon={BookOpen} title="No courses yet" message="No courses found for your batch." />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {courses.map((course) => (
        <Card key={course.id} hover>
          <p className="text-base font-display font-semibold text-ink">{course.name}</p>
          <p className="text-xs text-ink-faint mt-0.5">{course.code} · {course.institution}</p>

          {course.educators?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {course.educators.map((edu) => {
                const isActive = expanded?.courseId === course.id && expanded?.educatorId === edu.id;
                return (
                  <button
                    key={edu.id}
                    onClick={() => toggleEducator(course.id, edu)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
                      ${isActive
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-ink/[0.03] text-ink-soft border-transparent hover:bg-ink/[0.06]'
                      }`}
                  >
                    {edu.name}
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {expanded?.courseId === course.id && (
              <EducatorInlineDetail
                educatorId={expanded.educatorId}
                educatorName={expanded.educatorName}
                onClose={() => setExpanded(null)}
              />
            )}
          </AnimatePresence>

          <CourseActivityProgress
            courseId={course.id}
            studentId={studentId}
            progressRecords={progressRecords}
            canComplete
            onChange={onProgressChange}
          />
        </Card>
      ))}
    </div>
  );
}
