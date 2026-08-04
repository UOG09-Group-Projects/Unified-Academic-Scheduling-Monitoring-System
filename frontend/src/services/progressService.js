import api from './api';

const progressService = {
  listForStudent: (studentId) =>
    api.get('/progress/', { params: { student_id: studentId } }).then((r) => r.data),

  setProgress: (studentId, activityId, value) =>
    api.post('/progress/', { student_id: studentId, activity_id: activityId, value }).then((r) => r.data),

  setStatus: (studentId, activityId, status) =>
    api.post('/progress/', { student_id: studentId, activity_id: activityId, status }).then((r) => r.data),
};

export default progressService;
