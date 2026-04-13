import { useState, useEffect, useRef } from 'react';
import { searchApi } from '../api/search.api.js';

/**
 * Duplicate detection hook — now hits real backend.
 * Calls GET /api/search/similar?title=... with 500ms debounce.
 * Backend uses Qdrant vector search (cosine similarity).
 *
 * Falls back gracefully if API call fails.
 */
export const useDuplicateDetection = (title, existingBugs, delay = 500) => {
  const [similar,    setSimilar]    = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!title || title.length < 10) {
      setSimilar([]);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchApi.similar(title);
        setSimilar(data.similar || []);
      } catch (err) {
        console.warn('Duplicate detection failed:', err.message);
        setSimilar([]);
      } finally {
        setIsChecking(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, delay]);

  return { similar, isChecking };
};
