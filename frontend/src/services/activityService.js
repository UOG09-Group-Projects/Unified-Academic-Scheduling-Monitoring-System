import api from './api';

const activityService = {
  listForCourse: (courseId) =>
    api.get('/activities/', { params: { course_id: courseId } }).then((r) => r.data),

  listRoster: (courseId) =>
    api.get('/activities/course-roster/', { params: { course_id: courseId } }).then((r) => r.data),

  create: (payload) =>
    api.post('/activities/', payload).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/activities/${id}/`, payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/activities/${id}/`).then((r) => r.data),
};

export default activityService;
