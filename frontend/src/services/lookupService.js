import axios from 'axios';

const API = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API,
});

// Read-only lookups used to populate the Institution dropdown and the
// Batch/Educator transfer lists in CourseForm. Adjust endpoints if your
// Institution/Batch/Educator modules expose different paths.
const lookupService = {
  listInstitutions: async () => {
    const res = await client.get('/institutions/');
    return res.data;
  },

  listBatches: async () => {
    const res = await client.get('/batches/');
    return res.data;
  },

  listEducators: async () => {
    const res = await client.get('/educators/');
    // Normalize to { id, name } so BatchTransfer/EducatorTransfer don't
    // need to know about first_name/last_name fields.
    return res.data.map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
    }));
  },
};

export default lookupService;