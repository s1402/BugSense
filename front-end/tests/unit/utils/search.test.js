import { smartSearch, findSimilarBugs } from '../../../src/utils/search.js';

const bugs = [
  {
    id: 'BUG-001',
    title: 'Checkout crashes on Safari',
    component: 'Checkout',
    description: 'Pay button throws TypeError',
    tags: ['safari-bug', 'checkout'],
    team: 'Frontend',
    status: 'open',
    priority: 'high',
  },
  {
    id: 'BUG-002',
    title: 'API Gateway 500 on /bugs',
    component: 'API Gateway',
    description: 'Returns internal server error',
    tags: ['api', 'backend'],
    team: 'Backend',
    status: 'in-progress',
    priority: 'critical',
  },
  {
    id: 'BUG-003',
    title: 'Dashboard slow to load',
    component: 'Dashboard',
    description: 'Takes 10s to render',
    tags: ['perf'],
    team: 'Frontend',
    status: 'resolved',
    priority: 'low',
  },
];

describe('smartSearch', () => {
  it('returns all bugs when query is empty and no filters', () => {
    expect(smartSearch(bugs, '')).toHaveLength(3);
  });

  it('applies status filter before scoring', () => {
    const result = smartSearch(bugs, '', { status: 'open' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('BUG-001');
  });

  it('applies priority filter', () => {
    const result = smartSearch(bugs, '', { priority: 'critical' });
    expect(result.map(b => b.id)).toEqual(['BUG-002']);
  });

  it('ignores filter when value is "all"', () => {
    expect(smartSearch(bugs, '', { status: 'all' })).toHaveLength(3);
  });

  it('ranks title matches above description matches', () => {
    const result = smartSearch(bugs, 'checkout');
    expect(result[0].id).toBe('BUG-001');
  });

  it('returns empty when query matches nothing', () => {
    expect(smartSearch(bugs, 'nonexistentword')).toEqual([]);
  });

  it('matches on tags', () => {
    const result = smartSearch(bugs, 'safari');
    expect(result[0].id).toBe('BUG-001');
  });
});

describe('findSimilarBugs (Jaccard)', () => {
  it('returns [] when title is shorter than 10 chars', () => {
    expect(findSimilarBugs('Crash', bugs)).toEqual([]);
  });

  it('finds similar bugs above the 0.15 similarity threshold', () => {
    const result = findSimilarBugs('Checkout crashes on Chrome browser', bugs);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].bug.id).toBe('BUG-001');
    expect(result[0].similarity).toBeGreaterThan(0.15);
  });

  it('caps results at top 3', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: `BUG-${i}`, title: 'Checkout crashes intermittently', component: 'C',
    }));
    expect(findSimilarBugs('Checkout crashes intermittently', many).length).toBeLessThanOrEqual(3);
  });

  it('sorts by similarity descending', () => {
    const result = findSimilarBugs('Checkout crashes on Safari browser', bugs);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].similarity).toBeGreaterThanOrEqual(result[i].similarity);
    }
  });
});
