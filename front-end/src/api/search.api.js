import client from './client.js';

export const searchApi = {
  // GET /api/search?q=checkout crash  — full semantic search
  semantic: (query) =>
    client.get('/search', { params: { q: query } }),

  // GET /api/search/similar?title=...  — duplicate detection while typing
  similar: (title) =>
    client.get('/search/similar', { params: { title } }),
};
