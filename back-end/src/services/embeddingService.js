import { GoogleGenAI } from '@google/genai';

let ai;
const getAI = () => {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

const EMBEDDING_MODEL = 'gemini-embedding-001';
export const VECTOR_SIZE = 3072;

const toPlainArray = (values) => Array.from(values).map(Number);

export const generateBugEmbedding = async (bug) => {
  const text = [
    `Title: ${bug.title}`,
    `Component: ${bug.component}`,
    `Description: ${bug.description}`,
    bug.logs ? `Logs: ${bug.logs}` : '',
  ].filter(Boolean).join('\n');

  const result = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: { taskType: 'RETRIEVAL_DOCUMENT' },
  });

  const values = toPlainArray(result.embeddings[0].values);
  console.log(`  📐 Embedding generated: ${values.length} dims, type: ${typeof values[0]}`);
  return values;
};

export const generateQueryEmbedding = async (query) => {
  const result = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: query,
    config: { taskType: 'RETRIEVAL_QUERY' },
  });

  return toPlainArray(result.embeddings[0].values);
};