import client from './client.js';

export const bugsApi = {
  // GET /api/bugs?status=open&priority=critical&team=Frontend
  getAll: (filters = {}) => {
    const params = {};
    if (filters.status   && filters.status   !== 'all') params.status   = filters.status;
    if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;
    if (filters.team     && filters.team     !== 'all') params.team     = filters.team;
    return client.get('/bugs', { params });
  },

  // GET /api/bugs/:id
  getById: (id) =>
    client.get(`/bugs/${id}`),

  // POST /api/bugs  — triggers AI pipeline async
  create: (data) =>
    client.post('/bugs', data),

  // PATCH /api/bugs/:id
  update: (id, data) =>
    client.patch(`/bugs/${id}`, data),

  // DELETE /api/bugs/:id
  delete: (id) =>
    client.delete(`/bugs/${id}`),
};
