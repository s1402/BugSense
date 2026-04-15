import Groq from 'groq-sdk';

let groq;
const getGroq = () => {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
};
const llmModel = "llama-3.1-8b-instant";

const TEAM_OWNERSHIP = {
  'Checkout':          { team: 'Frontend',       assignee: 'Sarah Chen' },
  'API Gateway':       { team: 'Backend',        assignee: 'Marcus Webb' },
  'Authentication':    { team: 'Backend',        assignee: 'Marcus Webb' },
  'Search':            { team: 'Security',       assignee: 'Aisha Patel' },
  'Dashboard':         { team: 'Frontend',       assignee: 'Priya Nair' },
  'Notifications':     { team: 'Backend',        assignee: 'Marcus Webb' },
  'Export Service':    { team: 'Data',           assignee: 'Priya Nair' },
  'WebSocket Service': { team: 'Infrastructure', assignee: 'James Park' },
  'Mobile Auth':       { team: 'Mobile',         assignee: 'Leo Santos' },
  'Analytics':         { team: 'Frontend',       assignee: 'Priya Nair' },
};

/**
 * Build the RAG context block from similar bugs.
 * Passes real bug content to LLM — not just IDs.
 */
const buildSimilarBugsContext = (similarBugs) => {
  if (!similarBugs || similarBugs.length === 0) {
    return 'No similar past bugs found in the knowledge base.';
  }

  return similarBugs.map((b, i) =>
    `  ${i + 1}. "${b.title}" (${Math.round(b.score * 100)}% semantic match)
     - Component: ${b.component} | Priority: ${b.priority} | Status: ${b.status}
     - Assigned to: ${b.assignee || 'unassigned'} (${b.team} team)`
  ).join('\n');
};

/**
 * Use Groq LLM to analyze a bug and predict multiple fields.
 * LLM now predicts: priority, assignee, team, tags, rootCause, reason, confidenceScore
 * Similar bugs are passed with full context for real RAG reasoning.
 */
export const analyzeBugWithAI = async (bug, similarBugs = []) => {
  const ownership = TEAM_OWNERSHIP[bug.component] || { team: 'Backend', assignee: 'Marcus Webb' };
  const similarContext = buildSimilarBugsContext(similarBugs);

  const prompt = `You are a senior engineering lead doing bug triage. Analyze this bug report and predict multiple fields. Respond ONLY with valid JSON — no markdown, no explanation, no extra text.

NEW BUG REPORT:
- Title: ${bug.title}
- Component: ${bug.component}
- Description: ${bug.description}
- Logs/Stack trace: ${bug.logs || 'None provided'}

SIMILAR PAST BUGS FROM KNOWLEDGE BASE (use these to inform your predictions):
${similarContext}

COMPONENT OWNERSHIP:
- ${bug.component} is owned by ${ownership.assignee} (${ownership.team} team)
- Available engineers: Sarah Chen (Frontend), Marcus Webb (Backend), Priya Nair (Data/Frontend), James Park (Infrastructure), Leo Santos (Mobile), Aisha Patel (Security)

Respond with ONLY this JSON object:
{
  "suggestedPriority": "critical|high|medium|low",
  "suggestedAssignee": "engineer full name",
  "suggestedTeam": "team name",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "confidenceScore": 0.85,
  "rootCause": "One sentence technical root cause hypothesis",
  "reason": "2-3 sentences explaining your priority decision, who you assigned it to and why, referencing similar past bugs if relevant"
}

Priority rules:
- critical: production down, data loss, security breach, payment failure, OOM crash
- high: major feature broken, significant user impact, no workaround
- medium: feature degraded, workaround exists, affects subset of users
- low: minor issue, cosmetic, low user impact

Tag rules: generate 2-4 lowercase hyphenated tags based on the technology and type of issue (e.g. "memory-leak", "safari-bug", "auth-flow", "db-connection")`;

  console.log(`prompt sent to Groq llm ${llmModel} :  ${prompt}`)
  try {
    const completion = await getGroq().chat.completions.create({
      model:       llmModel,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens:  500,
    });

    const text  = completion.choices[0]?.message?.content?.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    console.log(` 🤖 Groq Analysis: ${parsed.suggestedPriority} priority (${Math.round((parsed.confidenceScore || 0) * 100)}% confidence) → ${parsed.suggestedAssignee}  → suggestedTeam ${parsed.suggestedTeam}`);

    return {
      suggestedPriority: parsed.suggestedPriority || ownership.assignee,
      suggestedAssignee: parsed.suggestedAssignee || ownership.assignee,
      suggestedTeam:     parsed.suggestedTeam     || ownership.team,
      suggestedTags:     Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
      confidenceScore:   Math.min(1, Math.max(0, parsed.confidenceScore || 0.75)),
      rootCause:         parsed.rootCause || '',
      reason:            parsed.reason    || 'AI analysis completed.',
    };
  } catch (err) {
    console.error('Groq analysis failed, using fallback:', err.message);
    return fallbackAnalysis(bug, ownership);
  }
};

const fallbackAnalysis = (bug, ownership) => ({
  suggestedPriority: bug.severity || 'medium',
  suggestedAssignee: ownership.assignee,
  suggestedTeam:     ownership.team,
  suggestedTags:     [bug.component?.toLowerCase().replace(' ', '-')].filter(Boolean),
  confidenceScore:   0.60,
  rootCause:         'Unable to determine root cause automatically — manual review needed.',
  reason:            `Routed to ${ownership.assignee} (${ownership.team} team) based on component ownership. Manual triage recommended.`,
});
