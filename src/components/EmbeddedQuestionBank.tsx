import { useEffect } from 'react';
import OfficialQuestionWorkspaceV5 from '@/components/OfficialQuestionWorkspaceV5';

const CACHE_REPAIR_MARKER = 'conectae:official-cache-repair:2026-09-11-v1';
const STALE_CACHE_PREFIX = 'conectae:official-v16:';

export default function EmbeddedQuestionBank() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CACHE_REPAIR_MARKER) === '1') return;
      const staleKeys: string[] = [];
      for (let index = 0; index < sessionStorage.length; index += 1) {
        const key = sessionStorage.key(index);
        if (key?.startsWith(STALE_CACHE_PREFIX)) staleKeys.push(key);
      }
      staleKeys.forEach((key) => sessionStorage.removeItem(key));
      sessionStorage.setItem(CACHE_REPAIR_MARKER, '1');
    } catch {
      // Cache cleanup must never block the question bank.
    }
  }, []);

  return <OfficialQuestionWorkspaceV5 />;
}
