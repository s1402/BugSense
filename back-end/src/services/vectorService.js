import { qdrantClient, COLLECTION_NAME } from '../config/qdrant.js';
import { v4 as uuidv4 } from 'uuid';

const SIMILARITY_THRESHOLD = 0.82;

export const upsertBugVector = async (bugId, embedding, metadata = {}) => {
  const pointId = uuidv4();

  // Ensure plain number array
  const vector = Array.from(embedding).map(Number);

  console.log(`  📦 Upserting vector: ${vector.length} dims, first value: ${vector[0]}, type: ${typeof vector[0]}`);

  try {
    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: [{
        id: pointId,
        vector,
        payload: {
          bugId: bugId.toString(),
          component: metadata.component || '',
          team: metadata.team || '',
          priority: metadata.priority || 'medium',
          status: metadata.status || 'open',
        },
      }],
    });
  } catch (err) {
    console.error(`  ❌ Qdrant upsert error:`, err?.data || err?.message || err);
    throw err;
  }

  return pointId;
};

export const searchSimilarBugs = async (embedding, excludeBugId = null, limit = 5) => {
  const vector = Array.from(embedding).map(Number);

  const results = await qdrantClient.search(COLLECTION_NAME, {
    vector,
    limit: limit + 1,
    score_threshold: SIMILARITY_THRESHOLD,
    with_payload: true,
  });

  return results
    .filter(r => r.payload.bugId !== excludeBugId?.toString())
    .slice(0, limit)
    .map(r => ({
      bugId: r.payload.bugId,
      score: Math.round(r.score * 100) / 100,
      component: r.payload.component,
    }));
};

export const semanticSearch = async (embedding, limit = 10) => {
  const vector = Array.from(embedding).map(Number);

  const results = await qdrantClient.search(COLLECTION_NAME, {
    vector,
    limit,
    score_threshold: 0.6,
    with_payload: true,
  });

  return results.map(r => ({
    bugId: r.payload.bugId,
    score: Math.round(r.score * 100) / 100,
  }));
};

export const deleteBugVector = async (pointId) => {
  await qdrantClient.delete(COLLECTION_NAME, {
    wait: true,
    points: [pointId],
  });
};