/**
 * Smart search with relevance scoring.
 * Ranks results rather than just filtering them.
 * When backend is ready, this function gets replaced with
 * a single fetch to /api/search?q= (Qdrant vector search).
 */

const tokenize = (str) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

const scoreMatch = (bug, tokens) => {
  let score = 0;

  for (const token of tokens) {
    // Exact ID match — highest weight
    if (bug.id.toLowerCase() === token) score += 10;

    // Title matches — high weight
    const titleTokens = tokenize(bug.title);
    if (titleTokens.includes(token)) score += 4;
    else if (bug.title.toLowerCase().includes(token)) score += 2;

    // Component match
    if (bug.component.toLowerCase().includes(token)) score += 3;

    // Tag match
    if (bug.tags?.some(t => t.includes(token))) score += 2;

    // Team match
    if (bug.team?.toLowerCase().includes(token)) score += 1;

    // Description match — lower weight
    if (bug.description?.toLowerCase().includes(token)) score += 1;
  }

  return score;
};

/**
 * @param {Array} bugs - all bugs
 * @param {string} query - raw search string
 * @param {Object} filters - { status, priority, team }
 * @returns {Array} sorted bugs with scores
 */
export const smartSearch = (bugs, query, filters = {}) => {
  // Apply hard filters first
  let results = bugs.filter(bug => {
    if (filters.status && filters.status !== 'all' && bug.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && bug.priority !== filters.priority) return false;
    if (filters.team && filters.team !== 'all' && bug.team !== filters.team) return false;
    return true;
  });

  // No query — return filter results as-is
  if (!query.trim()) return results;

  const tokens = tokenize(query);

  // Score each bug and remove zero-score (no match)
  const scored = results
    .map(bug => ({ bug, score: scoreMatch(bug, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ bug }) => bug);
};

/**
 * Lightweight duplicate detection for live preview while typing.
 * Uses token overlap — will be replaced by embedding cosine similarity
 * once /api/bugs/similar endpoint is ready.
 * @param {string} title - new bug title being typed
 * @param {Array} bugs - existing bugs
 * @returns {Array} top 3 potential duplicates with similarity score
 */
export const findSimilarBugs = (title, bugs) => {
  if (!title || title.length < 10) return [];

  const inputTokens = new Set(tokenize(title));
  if (inputTokens.size === 0) return [];

  return bugs
    .map(bug => {
      const bugTokens = new Set(tokenize(bug.title));
      const intersection = [...inputTokens].filter(t => bugTokens.has(t));
      const union = new Set([...inputTokens, ...bugTokens]);
      const similarity = intersection.length / union.size; // Jaccard similarity
      return { bug, similarity };
    })
    .filter(({ similarity }) => similarity > 0.15)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
};
