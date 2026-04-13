import { Bug } from '../models/Bug.js';
import { generateBugEmbedding } from './embeddingService.js';
import { upsertBugVector, searchSimilarBugs, deleteBugVector } from './vectorService.js';
import { analyzeBugWithAI } from './aiService.js';

/**
 * Full AI pipeline run after bug creation.
 *
 * RAG flow:
 * 1. Generate embedding from bug content
 * 2. Search Qdrant for similar vectors
 * 3. Fetch FULL details of similar bugs from MongoDB  ← fixes broken RAG
 * 4. Pass full context to LLM (title, priority, status, assignee of similar bugs)
 * 5. LLM predicts: priority, assignee, team, tags, rootCause, reason
 * 6. Store vector + update MongoDB + emit socket event
 */
export const runAIPipeline = async (bug, io = null) => {
  try {
    console.log(`🤖 AI pipeline started for ${bug._id}`);

    // Step 1 — Embed the new bug
    const embedding = await generateBugEmbedding(bug);

    // Step 2 — Find similar vectors in Qdrant
    const similarVectors = await searchSimilarBugs(embedding, bug._id, 3);
    console.log(`📦 Similar vectors recieved: ${similarVectors}`);

    // Step 3 — Fetch FULL bug documents from MongoDB
    // Passing only IDs to LLM is useless — we need actual content
    const similarBugIds  = similarVectors.map(v => v.bugId);
    const similarBugDocs = await Bug.find({ _id: { $in: similarBugIds } })
      .select('title description component priority status assignee team ai');

    // Merge score from Qdrant with full content from MongoDB
    const similarContext = similarVectors
      .map(v => {
        const doc = similarBugDocs.find(b => b._id.toString() === v.bugId);
        if (!doc) return null;
        return {
          bugId:     doc.bugId,
          score:     v.score,
          title:     doc.title,
          component: doc.component,
          priority:  doc.priority,
          status:    doc.status,
          assignee:  doc.assignee,
          team:      doc.team,
        };
      })
      .filter(Boolean);

    // Step 4 — LLM analysis with real RAG context
    const aiResult = await analyzeBugWithAI(bug, similarContext);

    // Step 5 — Store vector in Qdrant
    const pointId = await upsertBugVector(bug._id, embedding, {
      component: bug.component,
      team:      aiResult.suggestedTeam,
      priority:  aiResult.suggestedPriority,
      status:    bug.status,
    });

    // Step 6 — Update bug with all AI predictions
    const mergedTags = [...new Set([...(bug.tags || []), ...(aiResult.suggestedTags || [])])];

    const updatedBug = await Bug.findByIdAndUpdate(
      bug._id,
      {
        priority:    aiResult.suggestedPriority,
        assignee:    aiResult.suggestedAssignee,
        team:        aiResult.suggestedTeam,
        tags:        mergedTags,
        embeddingId: pointId,
        ai: {
          suggestedPriority: aiResult.suggestedPriority,
          suggestedAssignee: aiResult.suggestedAssignee,
          suggestedTeam:     aiResult.suggestedTeam,
          suggestedTags:     aiResult.suggestedTags,
          confidenceScore:   aiResult.confidenceScore,
          reason:            aiResult.reason,
          rootCause:         aiResult.rootCause,
          similarBugs:       similarContext.map(s => s.bugId),
          duplicateOf:       similarContext[0]?.score >= 0.93 ? similarContext[0].bugId : null,
        },
        $push: {
          timeline: {
            type:    'ai_analyzed',
            actor:   'BugSense AI',
            message: `AI analyzed — ${aiResult.suggestedPriority} priority, assigned to ${aiResult.suggestedAssignee}`,
            metadata: {
              confidenceScore: aiResult.confidenceScore,
              similarBugs: similarContext.map(s => ({
                bugId: s.bugId, score: s.score, title: s.title,
              })),
            },
          },
        },
      },
      { new: true }
    );

    // Step 7 — Emit real-time event to frontend
    if (io) {
      io.emit('bug:ai_analyzed', {
        bugId:   updatedBug.bugId,
        message: `${updatedBug.bugId} analyzed — ${aiResult.suggestedPriority} priority → ${aiResult.suggestedAssignee}`,
        actor:   'BugSense AI',
        variant: 'success',
        bug:     updatedBug,
      });
    }

    console.log(`✅ AI pipeline complete for ${updatedBug.bugId}`);
    return updatedBug;
  } catch (err) {
    console.error(`❌ AI pipeline failed for ${bug._id}:`, err.message);
  }
};

/**
 * Re-embed a bug after manual content edits (description, component, title).
 * Keeps Qdrant in sync so future RAG searches reflect the updated content.
 *
 * Flow: delete old vector → generate new embedding → upsert new vector → update embeddingId
 */
export const reembedBug = async (bugId) => {
  try {
    const bug = await Bug.findById(bugId);
    if (!bug) return;

    console.log(`🔄 Re-embedding bug ${bug.bugId}...`);

    // Delete old vector if it exists
    if (bug.embeddingId) {
      await deleteBugVector(bug.embeddingId).catch(console.error);
    }

    // Generate new embedding from updated content
    const embedding = await generateBugEmbedding(bug);

    // Upsert new vector with current metadata
    const pointId = await upsertBugVector(bug._id, embedding, {
      component: bug.component,
      team:      bug.team,
      priority:  bug.priority,
      status:    bug.status,
    });

    // Update embeddingId in MongoDB
    await Bug.findByIdAndUpdate(bug._id, { embeddingId: pointId });
    console.log(`✅ Re-embedded ${bug.bugId} → vector ${pointId}`);
  } catch (err) {
    console.error(`❌ Re-embedding failed for ${bugId}:`, err.message);
  }
};
