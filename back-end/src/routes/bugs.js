import express from 'express';
import { Bug } from '../models/Bug.js';
import { protect } from '../middleware/auth.js';
import { runAIPipeline, reembedBug } from '../services/bugService.js';

const router = express.Router();

// GET /api/bugs
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, priority, team, assignee } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (team)     filter.team     = team;
    if (assignee) filter.assignee = assignee;

    const bugs = await Bug.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: bugs.length, bugs });
  } catch (err) { next(err); }
});

// GET /api/bugs/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });
    res.json({ success: true, bug });
  } catch (err) { next(err); }
});

// POST /api/bugs — create bug, AI pipeline runs async
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, logs, component, team } = req.body;
    const io = req.app.get('io');

    // Bug saved immediately with medium priority as placeholder
    // AI pipeline will update priority, assignee, team, tags async
    const bug = await Bug.create({
      title, description, logs, component,
      team:      team || '',
      status:    'open',
      priority:  'medium',        // placeholder — AI will override this
      reportedBy: req.user.name,
      timeline: [{
        type:    'created',
        actor:   req.user.name,
        message: `${req.user.name} reported this bug`,
        metadata: { component },
      }],
    });

    // Return immediately — don't block on AI
    res.status(201).json({ success: true, bug });

    // AI pipeline runs in background
    runAIPipeline(bug, io).catch(console.error);
  } catch (err) { next(err); }
});

// PATCH /api/bugs/:id
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { status, priority, assignee, aiOverridden, description, component } = req.body;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

    const io = req.app.get('io');
    const timelineEvents = [];

    if (status && status !== bug.status) {
      timelineEvents.push({
        type: 'status_changed', actor: req.user.name,
        message: `Status changed from ${bug.status} to ${status}`,
        metadata: { from: bug.status, to: status },
      });
    }

    if (priority && priority !== bug.priority) {
      timelineEvents.push({
        type: 'priority_changed', actor: req.user.name,
        message: `Priority changed from ${bug.priority} to ${priority}`,
        metadata: { from: bug.priority, to: priority },
      });
    }

    if (assignee !== undefined && assignee !== bug.assignee) {
      timelineEvents.push({
        type: 'assigned', actor: req.user.name,
        message: `Assigned to ${assignee || 'Unassigned'}`,
        metadata: { assignee },
      });
    }

    if (description !== undefined && description !== bug.description) {
      timelineEvents.push({
        type: 'comment', actor: req.user.name,
        message: 'Description updated',
      });
    }

    if (component !== undefined && component !== bug.component) {
      timelineEvents.push({
        type: 'comment', actor: req.user.name,
        message: `Component changed from ${bug.component} to ${component}`,
        metadata: { from: bug.component, to: component },
      });
    }

    if (aiOverridden) {
      timelineEvents.push({
        type: 'ai_overridden', actor: req.user.name,
        message: `AI decision overridden — priority: ${priority || bug.priority}, assignee: ${assignee || bug.assignee}`,
        metadata: { priority, assignee },
      });
    }

    const updated = await Bug.findByIdAndUpdate(
      req.params.id,
      {
        ...(status      && { status }),
        ...(priority    && { priority }),
        ...(assignee    !== undefined && { assignee }),
        ...(description !== undefined && { description }),
        ...(component   !== undefined && { component }),
        ...(aiOverridden && { aiOverridden: true }),
        ...(timelineEvents.length > 0 && { $push: { timeline: { $each: timelineEvents } } }),
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, bug: updated });

    // Emit socket event for ALL changes so every client refreshes
    if (timelineEvents.length > 0 && io) {
      io.emit('bug:updated', {
        bugId:   updated.bugId,
        message: timelineEvents.map(e => e.message).join('; '),
        actor:   req.user.name,
        variant: 'info',
      });
    }

    // Re-embed async if content fields changed (keeps Qdrant in sync for RAG)
    const contentChanged = description !== undefined || component !== undefined;
    if (contentChanged) {
      reembedBug(req.params.id).catch(err =>
        console.error(`Re-embedding failed for ${req.params.id}:`, err.message)
      );
    }
  } catch (err) { next(err); }
});

// DELETE /api/bugs/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const bugId = req.params.id;
    const bug = await Bug.findByIdAndDelete(bugId);
    if (!bug) return res.status(404).json({ success: false, message: 'Bug not found' });

    if (io) {
      io.emit('bug:deleted', {
        bugId:   bug.bugId,
        message: `${bug.bugId} deleted`,
        actor:   req.user.name,
        variant: 'info',
      });
    }
    res.json({ success: true, message: 'Bug deleted' });
  } catch (err) { next(err); }
});

export default router;
