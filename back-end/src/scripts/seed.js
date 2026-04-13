import 'dotenv/config';
import mongoose from 'mongoose';
import { Bug } from '../models/Bug.js';
import { User } from '../models/User.js';
import { qdrantClient, COLLECTION_NAME } from '../config/qdrant.js';
import { generateBugEmbedding } from '../services/embeddingService.js';
import { upsertBugVector } from '../services/vectorService.js';

const VECTOR_SIZE = 3072;

const USERS = [
  { name: 'Alex Rivera',  email: 'alex@bugsense.dev',   password: 'password123', role: 'Senior Engineer',   team: 'Frontend' },
  { name: 'Sarah Chen',   email: 'sarah@bugsense.dev',  password: 'password123', role: 'Frontend Engineer', team: 'Frontend' },
  { name: 'Marcus Webb',  email: 'marcus@bugsense.dev', password: 'password123', role: 'Backend Engineer',  team: 'Backend' },
  { name: 'Priya Nair',   email: 'priya@bugsense.dev',  password: 'password123', role: 'Full Stack',        team: 'Data' },
  { name: 'James Park',   email: 'james@bugsense.dev',  password: 'password123', role: 'DevOps Engineer',   team: 'Infrastructure' },
  { name: 'Leo Santos',   email: 'leo@bugsense.dev',    password: 'password123', role: 'Mobile Engineer',   team: 'Mobile' },
  { name: 'Aisha Patel',  email: 'aisha@bugsense.dev',  password: 'password123', role: 'Security Engineer', team: 'Security' },
];

const BUGS_SEED = [
  { title: 'Checkout page crashes on Safari 16 when applying coupon code', description: 'Users on Safari 16.x experience a full page crash when attempting to apply a coupon code during checkout.', logs: "TypeError: Cannot read properties of undefined (reading 'apply')\n  at CouponService.validate (checkout.js:234)", component: 'Checkout', severity: 'critical', priority: 'critical', status: 'open', assignee: 'Sarah Chen', team: 'Frontend', tags: ['safari', 'checkout', 'payments'] },
  { title: 'API rate limiter incorrectly blocking valid authenticated requests', description: 'The rate limiter middleware is treating authenticated users as anonymous, causing valid API calls to be rejected with 429.', logs: 'WARN [RateLimiter] Anonymous limit reached\nERROR [AuthMiddleware] Token verified but context not propagated', component: 'API Gateway', severity: 'high', priority: 'high', status: 'in-progress', assignee: 'Marcus Webb', team: 'Backend', tags: ['api', 'auth', 'rate-limiting'] },
  { title: 'Dashboard charts render blank on first load, require manual refresh', description: 'Analytics dashboard charts show empty state on initial page load. Hard refresh resolves the issue.', logs: "Warning: Can't perform a React state update on an unmounted component.", component: 'Dashboard', severity: 'medium', priority: 'medium', status: 'open', assignee: 'Priya Nair', team: 'Frontend', tags: ['dashboard', 'charts'] },
  { title: 'Memory leak in WebSocket connection manager causes server OOM after 48h', description: 'Production servers running for 48+ hours show exponential memory growth.', logs: 'FATAL: JavaScript heap out of memory\n  at WebSocketManager.cleanup (ws/manager.js:189)', component: 'WebSocket Service', severity: 'critical', priority: 'critical', status: 'open', assignee: null, team: 'Backend', tags: ['memory-leak', 'websocket', 'production'] },
  { title: 'Search autocomplete leaks user query history to other sessions', description: "Search suggestions show previous users' query history when session cookies are cleared.", logs: 'DEBUG [CacheService] Cache hit for anonymous session key: search:undefined', component: 'Search', severity: 'critical', priority: 'critical', status: 'resolved', assignee: 'Aisha Patel', team: 'Security', tags: ['security', 'pii', 'cache'] },
  { title: 'Mobile app login loop on Android 14 after biometric auth failure', description: 'On Android 14, failed biometric auth triggers infinite redirect loop instead of falling back to PIN.', logs: 'BiometricError: BIOMETRIC_ERROR_HW_UNAVAILABLE (code: 1)', component: 'Mobile Auth', severity: 'high', priority: 'high', status: 'in-progress', assignee: 'Leo Santos', team: 'Mobile', tags: ['android', 'biometric', 'auth'] },
  { title: 'CSV export truncates rows after 10,000 records silently', description: 'Bulk data export via CSV silently truncates at 10,000 rows with no error shown.', logs: 'INFO [ExportService] Export complete. rowsWritten: 10000', component: 'Export Service', severity: 'medium', priority: 'medium', status: 'open', assignee: 'Priya Nair', team: 'Data', tags: ['export', 'csv'] },
  { title: 'Notification emails sent in wrong locale after user updates timezone', description: "After a user changes their timezone, emails are sent in system default locale (en-US).", logs: 'DEBUG [I18n] Locale resolved: en-US (fallback)', component: 'Notifications', severity: 'low', priority: 'low', status: 'open', assignee: null, team: 'Backend', tags: ['i18n', 'notifications'] },
];

const resetQdrant = async () => {
  try {
    await qdrantClient.deleteCollection(COLLECTION_NAME);
    console.log(`🗑️  Qdrant collection deleted`);
  } catch {
    // Collection might not exist — that's fine
  }
  await qdrantClient.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
  });
  console.log(`✅ Qdrant collection created (${VECTOR_SIZE} dims)`);
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await resetQdrant();

    await Bug.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared MongoDB data');

    const users = await User.create(USERS);
    console.log(`👥 Created ${users.length} users`);

    for (const bugData of BUGS_SEED) {
      const reporter = users[0];
      const bug = await Bug.create({
        ...bugData,
        reportedBy: reporter.name,
        timeline: [
          { type: 'created', actor: reporter.name, message: `${reporter.name} created this bug`, metadata: {} },
          { type: 'ai_analyzed', actor: 'BugSense AI', message: `AI suggested ${bugData.priority} priority`, metadata: { confidenceScore: 0.85 } },
        ],
        ai: {
          suggestedPriority: bugData.priority,
          suggestedAssignee: bugData.assignee,
          suggestedTeam: bugData.team,
          confidenceScore: Math.round((0.75 + Math.random() * 0.22) * 100) / 100,
          reason: `Based on component "${bugData.component}" and severity "${bugData.severity}".`,
          similarBugs: [],
        },
      });

      const embedding = await generateBugEmbedding(bug);
      const pointId = await upsertBugVector(bug._id, embedding, { component: bug.component, team: bug.team });
      await Bug.findByIdAndUpdate(bug._id, { embeddingId: pointId });
      console.log(`  🐛 ${bug.bugId} seeded`);
    }

    console.log('\n✅ Seed complete!');
    console.log('📧 Login: alex@bugsense.dev / password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();