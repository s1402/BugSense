// Jest reads import.meta.env via Vite at build time; stub it for tests.
process.env.VITE_API_URL = 'http://localhost:5000';
process.env.VITE_SOCKET_URL = 'http://localhost:5000';
