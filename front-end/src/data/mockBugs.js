export const TEAMS = ['Frontend', 'Backend', 'Infrastructure', 'Mobile', 'Security', 'Data'];
export const COMPONENTS = ['Checkout', 'API Gateway', 'Authentication', 'Search', 'Dashboard', 'Notifications', 'Export Service', 'WebSocket Service', 'Mobile Auth', 'Analytics'];
export const ENGINEERS = ['Sarah Chen', 'Marcus Webb', 'Priya Nair', 'James Park', 'Leo Santos', 'Aisha Patel'];
export const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export const mockBugs = [
  {
    id: 'BUG-001', title: 'Checkout page crashes on Safari 16 when applying coupon code',
    description: 'Users on Safari 16.x experience a full page crash when attempting to apply a coupon code during checkout. The JS console shows an unhandled promise rejection related to the payment iframe.',
    logs: "TypeError: Cannot read properties of undefined (reading 'apply')\n  at CouponService.validate (checkout.js:234)\n  at async CheckoutForm.handleSubmit (CheckoutForm.jsx:89)",
    component: 'Checkout', status: 'open', priority: 'critical', assignee: 'Sarah Chen', team: 'Frontend',
    tags: ['safari', 'checkout', 'payments'], createdAt: '2024-01-15T09:23:00Z', updatedAt: '2024-01-15T11:45:00Z',
    ai: { suggestedPriority: 'critical', suggestedAssignee: 'Sarah Chen', suggestedTeam: 'Frontend', confidenceScore: 0.94, reason: 'Checkout failures directly impact revenue. Safari-specific JS errors with payment integrations match 3 prior critical bugs resolved by Sarah Chen.', similarBugs: ['BUG-089', 'BUG-112'] }
  },
  {
    id: 'BUG-002', title: 'API rate limiter incorrectly blocking valid authenticated requests',
    description: 'The rate limiter middleware is treating authenticated users as anonymous, causing valid API calls to be rejected with 429 after just 10 requests instead of the 1000/min limit.',
    logs: 'WARN [RateLimiter] Anonymous limit reached for IP 10.0.1.45\nERROR [AuthMiddleware] Token verified but context not propagated\n  at rateLimitMiddleware (middleware/rateLimit.js:67)',
    component: 'API Gateway', status: 'in-progress', priority: 'high', assignee: 'Marcus Webb', team: 'Backend',
    tags: ['api', 'auth', 'rate-limiting'], createdAt: '2024-01-14T14:12:00Z', updatedAt: '2024-01-15T08:30:00Z',
    ai: { suggestedPriority: 'high', suggestedAssignee: 'Marcus Webb', suggestedTeam: 'Backend', confidenceScore: 0.88, reason: 'Auth context propagation bugs in middleware layer. Marcus Webb resolved BUG-067 which had identical stack trace pattern.', similarBugs: ['BUG-067', 'BUG-078'] }
  },
  {
    id: 'BUG-003', title: 'Dashboard charts render blank on first load, require manual refresh',
    description: 'Analytics dashboard charts show empty state on initial page load. Hard refresh resolves the issue. Problem appeared after the React Query migration in v2.4.1.',
    logs: "Warning: Can't perform a React state update on an unmounted component.\n  at BarChart (components/charts/BarChart.jsx:45)\nError: Query key mismatch during hydration",
    component: 'Analytics Dashboard', status: 'open', priority: 'medium', assignee: 'Priya Nair', team: 'Frontend',
    tags: ['dashboard', 'charts', 'react-query'], createdAt: '2024-01-13T10:00:00Z', updatedAt: '2024-01-14T16:22:00Z',
    ai: { suggestedPriority: 'medium', suggestedAssignee: 'Priya Nair', suggestedTeam: 'Frontend', confidenceScore: 0.81, reason: 'React hydration/query key mismatches are typical post-migration issues. Medium priority as workaround exists.', similarBugs: ['BUG-091'] }
  },
  {
    id: 'BUG-004', title: 'Memory leak in WebSocket connection manager causes server OOM after 48h',
    description: 'Production servers running for 48+ hours show exponential memory growth. Heap dumps indicate WebSocket connection objects are not being garbage collected after client disconnect.',
    logs: 'FATAL: JavaScript heap out of memory\n  at WebSocketManager.cleanup (ws/manager.js:189)\nRetained objects: 48,293 WebSocket instances\nHeap snapshot: 4.2GB used of 4.5GB limit',
    component: 'WebSocket Service', status: 'open', priority: 'critical', assignee: null, team: 'Backend',
    tags: ['memory-leak', 'websocket', 'production'], createdAt: '2024-01-15T06:45:00Z', updatedAt: '2024-01-15T06:45:00Z',
    ai: { suggestedPriority: 'critical', suggestedAssignee: 'James Park', suggestedTeam: 'Infrastructure', confidenceScore: 0.91, reason: 'Memory leaks causing OOM crashes are Sev-1 production incidents. James Park resolved the previous WebSocket leak in BUG-033.', similarBugs: ['BUG-033'] }
  },
  {
    id: 'BUG-005', title: 'Search autocomplete leaks user query history to other sessions',
    description: "Search suggestions show previous users' query history when browser session cookies are cleared but Redis cache is not. PII exposure risk.",
    logs: 'DEBUG [CacheService] Cache hit for anonymous session key: search:undefined\nWARN [SearchService] Returning cached results for null userId',
    component: 'Search', status: 'resolved', priority: 'critical', assignee: 'Aisha Patel', team: 'Security',
    tags: ['security', 'pii', 'cache'], createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-11T15:30:00Z',
    ai: { suggestedPriority: 'critical', suggestedAssignee: 'Aisha Patel', suggestedTeam: 'Security', confidenceScore: 0.97, reason: 'PII exposure through session/cache boundary failures is a critical security vulnerability. GDPR implications.', similarBugs: [] }
  },
  {
    id: 'BUG-006', title: 'Mobile app login loop on Android 14 after biometric auth failure',
    description: 'On Android 14 devices, failed biometric authentication triggers infinite redirect loop instead of falling back to PIN entry.',
    logs: 'BiometricError: BIOMETRIC_ERROR_HW_UNAVAILABLE (code: 1)\nNavigating to: /auth/biometric [repeated 847 times]',
    component: 'Mobile Auth', status: 'in-progress', priority: 'high', assignee: 'Leo Santos', team: 'Mobile',
    tags: ['android', 'biometric', 'auth'], createdAt: '2024-01-12T11:30:00Z', updatedAt: '2024-01-14T09:15:00Z',
    ai: { suggestedPriority: 'high', suggestedAssignee: 'Leo Santos', suggestedTeam: 'Mobile', confidenceScore: 0.86, reason: 'Android 14 biometric API changes caused breaking navigation changes. Leo Santos fixed the iOS equivalent (BUG-071).', similarBugs: ['BUG-071'] }
  },
  {
    id: 'BUG-007', title: 'CSV export truncates rows after 10,000 records silently',
    description: 'Bulk data export via CSV silently truncates at 10,000 rows with no error or warning shown to the user.',
    logs: 'INFO [ExportService] Starting export for userId: 4521, estimatedRows: 84293\nINFO [ExportService] Export complete. rowsWritten: 10000',
    component: 'Export Service', status: 'open', priority: 'medium', assignee: 'Priya Nair', team: 'Data',
    tags: ['export', 'csv', 'data-integrity'], createdAt: '2024-01-11T14:22:00Z', updatedAt: '2024-01-13T10:00:00Z',
    ai: { suggestedPriority: 'high', suggestedAssignee: 'Priya Nair', suggestedTeam: 'Data', confidenceScore: 0.79, reason: 'Silent data truncation without user notification is a data integrity issue. AI suggests upgrading to High.', similarBugs: [] }
  },
  {
    id: 'BUG-008', title: 'Notification emails sent in wrong locale after user updates timezone',
    description: "After a user changes their timezone in profile settings, subsequent email notifications are sent in system default locale (en-US) instead of the user's saved preference.",
    logs: 'DEBUG [NotificationService] Fetching user preferences for userId: 7823\nDEBUG [I18n] Locale resolved: en-US (fallback)\nWARN [UserPreferenceCache] Stale cache entry, TTL expired',
    component: 'Notifications', status: 'open', priority: 'low', assignee: null, team: 'Backend',
    tags: ['i18n', 'notifications', 'cache'], createdAt: '2024-01-09T16:45:00Z', updatedAt: '2024-01-09T16:45:00Z',
    ai: { suggestedPriority: 'low', suggestedAssignee: 'Marcus Webb', suggestedTeam: 'Backend', confidenceScore: 0.72, reason: 'Cache invalidation on preference update is a known pattern issue. Low user impact.', similarBugs: [] }
  },
];
