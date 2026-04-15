import { jest } from '@jest/globals';

const mockEmbedContent = jest.fn();

jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { embedContent: mockEmbedContent },
  })),
}));

const { generateBugEmbedding, generateQueryEmbedding, VECTOR_SIZE } = await import(
  '../../../src/services/embeddingService.js'
);

describe('embeddingService', () => {
  beforeEach(() => {
    mockEmbedContent.mockReset();
    mockEmbedContent.mockResolvedValue({
      embeddings: [{ values: new Array(3072).fill(0.1) }],
    });
  });

  it('exports the expected 3072-dim vector size', () => {
    expect(VECTOR_SIZE).toBe(3072);
  });

  it('generates document embedding with RETRIEVAL_DOCUMENT taskType', async () => {
    const bug = {
      title: 'API 500 on /bugs',
      component: 'API Gateway',
      description: 'Returns 500 when posting a bug',
      logs: 'stack trace',
    };

    const vec = await generateBugEmbedding(bug);

    expect(mockEmbedContent).toHaveBeenCalledTimes(1);
    const call = mockEmbedContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-embedding-001');
    expect(call.config.taskType).toBe('RETRIEVAL_DOCUMENT');
    expect(call.contents).toContain('Title: API 500 on /bugs');
    expect(call.contents).toContain('Component: API Gateway');
    expect(call.contents).toContain('Logs: stack trace');
    expect(vec).toHaveLength(3072);
  });

  it('omits logs line when bug has no logs', async () => {
    const bug = { title: 't', component: 'c', description: 'd' };
    await generateBugEmbedding(bug);

    const contents = mockEmbedContent.mock.calls[0][0].contents;
    expect(contents).not.toContain('Logs:');
  });

  it('generates query embedding with RETRIEVAL_QUERY taskType (asymmetric)', async () => {
    await generateQueryEmbedding('safari crash on checkout');

    const call = mockEmbedContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-embedding-001');
    expect(call.config.taskType).toBe('RETRIEVAL_QUERY');
    expect(call.contents).toBe('safari crash on checkout');
  });

  it('returns a plain number array, not a typed array', async () => {
    mockEmbedContent.mockResolvedValue({
      embeddings: [{ values: new Float32Array([0.1, 0.2, 0.3]) }],
    });

    const vec = await generateQueryEmbedding('x');
    expect(Array.isArray(vec)).toBe(true);
    expect(vec).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
  });
});
