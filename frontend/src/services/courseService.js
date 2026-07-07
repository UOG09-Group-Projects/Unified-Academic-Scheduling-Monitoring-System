import api from "./api";

export default {
  list: async (search) => {
    const res = await api.get("/courses/", { params: { search } });
    return res.data;
  },

  create: async (payload) => {
    const res = await api.post("/courses/", payload);
    return res.data;
  },

  update: async (id, payload) => {
    const res = await api.put(`/courses/${id}/`, payload);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/courses/${id}/`);
    return res.data;
  }
};