import client from './client.js';

export const authApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }),

  register: (data) =>
    client.post('/auth/register', data),

  me: () =>
    client.get('/auth/me'),

  // All registered users — for assignee dropdowns
  getUsers: () =>
    client.get('/auth/users'),
};
