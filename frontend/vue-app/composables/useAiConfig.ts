import { useState } from '#app';

export function useAiConfig() {
  const aiProvider = useState<string>('aiProvider', () => 'groq');
  const aiModel = useState<string>('aiModel', () => 'llama-3.3-70b-versatile');

  return {
    aiProvider,
    aiModel
  };
}
