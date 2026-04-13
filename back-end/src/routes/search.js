import express from 'express';
import { Bug } from '../models/Bug.js';
import { protect } from '../middleware/auth.js';
import { generateQueryEmbedding } from '../services/embeddingService.js';
import { semanticSearch } from '../services/vectorService.js';

const router = express.Router();

// GET /api/search?q=checkout crash safari
router.get('/', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Query must be at least 3 characters' });
    }

    // Generate embedding for search query
    const embedding = await generateQueryEmbedding(q.trim());

    // Search Qdrant for semantically similar bugs
    const vectorResults = await semanticSearch(embedding, 10);

    if (vectorResults.length === 0) {
      return res.json({ success: true, bugs: [], query: q });
    }

    // Fetch full bug documents from MongoDB, preserving score order
    const bugIds = vectorResults.map(r => r.bugId);
    const bugs = await Bug.find({ _id: { $in: bugIds } });

    // Re-sort by vector similarity score and attach score
    const scored = vectorResults
      .map(r => {
        const bug = bugs.find(b => b._id.toString() === r.bugId);
        return bug ? { ...bug.toJSON(), similarityScore: r.score } : null;
      })
      .filter(Boolean);

    res.json({ success: true, bugs: scored, query: q, count: scored.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/similar?title=... — duplicate detection for create bug form
router.get('/similar', protect, async (req, res, next) => {
  try {
    const { title } = req.query;
    if (!title || title.length < 10) {
      return res.json({ success: true, similar: [] });
    }

    const embedding = await generateQueryEmbedding(title);
    const vectorResults = await semanticSearch(embedding, 3);

    if (vectorResults.length === 0) {
      return res.json({ success: true, similar: [] });
    }

    const bugs = await Bug.find({ _id: { $in: vectorResults.map(r => r.bugId) } })
      .select('title priority status component');

    const similar = vectorResults.map(r => {
      const bug = bugs.find(b => b._id.toString() === r.bugId);
      return bug ? { bug, similarity: r.score } : null;
    }).filter(Boolean);

    res.json({ success: true, similar });
  } catch (err) {
    next(err);
  }
});

export default router;
