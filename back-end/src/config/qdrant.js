import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'bugsense_bugs';
const VECTOR_SIZE = 3072; // gemini-embedding-001 dimension

/**
 * Creates the Qdrant collection if it doesn't already exist.
 * Called once on server startup.
 */
export const initQdrantCollection = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`✅ Qdrant collection "${COLLECTION_NAME}" created`);
    } else {
      console.log(`✅ Qdrant collection "${COLLECTION_NAME}" ready`);
    }
  } catch (error) {
    console.error(`❌ Qdrant init failed: ${error.message}`);
    throw error;
  }
};

export { qdrantClient, COLLECTION_NAME };