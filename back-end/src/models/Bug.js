import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['created', 'ai_analyzed', 'assigned', 'priority_changed', 'status_changed', 'ai_overridden', 'comment'],
    required: true,
  },
  actor:    { type: String, required: true },
  message:  { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp:{ type: Date, default: Date.now },
}, { _id: false });

const aiResultSchema = new mongoose.Schema({
  suggestedPriority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  suggestedAssignee: String,
  suggestedTeam:     String,
  suggestedTags:     [String],   // ← NEW: AI-generated tags
  confidenceScore:   { type: Number, min: 0, max: 1 },
  reason:            String,
  rootCause:         String,     // ← NEW: one-line technical hypothesis
  similarBugs:       [String],
  duplicateOf:       String,
}, { _id: false });

const bugSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  logs:         { type: String, default: '' },
  component:    { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignee:     { type: String, default: null },
  team:         { type: String, default: '' },
  tags:         [String],
  reportedBy:   { type: String, required: true },
  ai:           { type: aiResultSchema, default: null },
  aiOverridden: { type: Boolean, default: false },
  embeddingId:  { type: String, default: null },
  timeline:     [timelineEventSchema],
}, {
  timestamps: true,
});

// Virtual for human-readable bug ID like BUG-3A152E
bugSchema.virtual('bugId').get(function () {
  return `BUG-${String(this._id).slice(-6).toUpperCase()}`;
});

bugSchema.set('toJSON', { virtuals: true });

export const Bug = mongoose.model('Bug', bugSchema);
