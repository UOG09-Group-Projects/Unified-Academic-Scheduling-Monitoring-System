import api from './api';

const enrollmentService = {
  listAvailableCourses: () =>
    api.get('/enrollments/available-courses/').then((r) => r.data),

  enroll: (courseId) =>
    api.post('/enrollments/', { course_id: courseId }).then((r) => r.data),

  unenroll: (enrollmentId) =>
    api.delete(`/enrollments/${enrollmentId}/`).then((r) => r.data),
};

export default enrollmentService;
