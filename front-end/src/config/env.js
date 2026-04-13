/**
 * Central environment config.
 * All env vars go through here — never import.meta.env directly in components.
 * Swap VITE_API_URL in .env.production for deployment — zero code changes needed.
 */
export const config = {
  apiUrl:    import.meta.env.VITE_API_URL    || 'http://localhost:5000',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  appName:   'BugSense',
  isDev:     import.meta.env.DEV,
};
