import axios from 'axios';

const API = 'http://localhost:8000/api';

// One axios instance so base URL / headers / interceptors live in one place.
const client = axios.create({
  baseURL: API,
});

const courseService = {
  /**
   * GET /courses/?search=...
   * Fetch the course list, optionally filtered by search term.
   */
  list: async (search = '') => {
    const res = await client.get('/courses/', { params: { search } });
    return res.data;
  },

  /**
   * GET /courses/:id/
   * Fetch a single course (with its batches/educators expanded).
   */
  getById: async (id) => {
    const res = await client.get(`/courses/${id}/`);
    return res.data;
  },

  /**
   * POST /courses/
   * Create a course. Expects:
   * { institution, name, code, batch_ids: [], educator_ids: [] }
   */
  create: async (payload) => {
    const res = await client.post('/courses/', payload);
    return res.data;
  },

  /**
   * PUT /courses/:id/
   * Update a course and replace its batch/educator assignments.
   */
  update: async (id, payload) => {
    const res = await client.put(`/courses/${id}/`, payload);
    return res.data;
  },

  /**
   * DELETE /courses/:id/
   * Soft-deletes the course and hard-deletes its CourseBatch/Allocation rows.
   */
  remove: async (id) => {
    const res = await client.delete(`/courses/${id}/`);
    return res.data;
  },
};

export default courseService;