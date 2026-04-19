import { useState } from '#app';

export function useAiConfig() {
  const aiProvider = useState<string>('aiProvider', () => 'openrouter');
  const aiModel = useState<string>('aiModel', () => 'google/gemma-3-27b-it:free');

  return {
    aiProvider,
    aiModel
  };
}
