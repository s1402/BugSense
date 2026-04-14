import { jest } from '@jest/globals';

const mockCreate = jest.fn();

jest.unstable_mockModule('groq-sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

const { analyzeBugWithAI } = await import('../../../src/services/aiService.js');

const sampleBug = {
  title: 'Checkout crashes on Safari',
  component: 'Checkout',
  description: 'Users on Safari 17 see a blank page after clicking Pay.',
  logs: 'TypeError: undefined is not a function',
};

describe('aiService.analyzeBugWithAI', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns normalized AI output when Groq responds with valid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            suggestedPriority: 'high',
            suggestedAssignee: 'Sarah Chen',
            suggestedTeam: 'Frontend',
            suggestedTags: ['safari-bug', 'checkout', 'js-error'],
            confidenceScore: 0.88,
            rootCause: 'Missing polyfill for optional chaining on Safari.',
            reason: 'Critical checkout flow is broken for Safari users.',
          }),
        },
      }],
    });

    const result = await analyzeBugWithAI(sampleBug, []);

    expect(result.suggestedPriority).toBe('high');
    expect(result.suggestedAssignee).toBe('Sarah Chen');
    expect(result.suggestedTeam).toBe('Frontend');
    expect(result.suggestedTags).toEqual(['safari-bug', 'checkout', 'js-error']);
    expect(result.confidenceScore).toBeCloseTo(0.88);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
      })
    );
  });

  it('strips ```json code fences from the LLM response before parsing', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: '```json\n' + JSON.stringify({
            suggestedPriority: 'medium',
            suggestedAssignee: 'Marcus Webb',
            suggestedTeam: 'Backend',
            suggestedTags: ['api'],
            confidenceScore: 0.7,
            rootCause: 'Race condition in handler.',
            reason: 'Minor degradation.',
          }) + '\n```',
        },
      }],
    });

    const result = await analyzeBugWithAI(sampleBug, []);
    expect(result.suggestedPriority).toBe('medium');
    expect(result.rootCause).toBe('Race condition in handler.');
  });

  it('clamps confidenceScore to the [0, 1] range', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            suggestedPriority: 'low',
            suggestedAssignee: 'Marcus Webb',
            suggestedTeam: 'Backend',
            suggestedTags: [],
            confidenceScore: 99,
            rootCause: 'x',
            reason: 'y',
          }),
        },
      }],
    });

    const result = await analyzeBugWithAI(sampleBug, []);
    expect(result.confidenceScore).toBe(1);
  });

  it('falls back to component-ownership mapping when Groq throws', async () => {
    mockCreate.mockRejectedValue(new Error('Groq API down'));

    const result = await analyzeBugWithAI(sampleBug, []);

    expect(result.suggestedAssignee).toBe('Sarah Chen');
    expect(result.suggestedTeam).toBe('Frontend');
    expect(result.confidenceScore).toBe(0.6);
    expect(result.suggestedTags).toContain('checkout');
  });

  it('includes similar-bug RAG context in the prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            suggestedPriority: 'high',
            suggestedAssignee: 'Sarah Chen',
            suggestedTeam: 'Frontend',
            suggestedTags: [],
            confidenceScore: 0.8,
            rootCause: 'x',
            reason: 'y',
          }),
        },
      }],
    });

    const similar = [{
      title: 'Payment button freezes on Safari',
      score: 0.91,
      component: 'Checkout',
      priority: 'high',
      status: 'resolved',
      assignee: 'Sarah Chen',
      team: 'Frontend',
    }];

    await analyzeBugWithAI(sampleBug, similar);

    const promptSent = mockCreate.mock.calls[0][0].messages[0].content;
    expect(promptSent).toContain('Payment button freezes on Safari');
    expect(promptSent).toContain('91% semantic match');
  });
});
