export function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function extractJsonBlock(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstArray = text.indexOf("[");
  const lastArray = text.lastIndexOf("]");

  if (firstArray !== -1 && lastArray > firstArray) {
    return text.slice(firstArray, lastArray + 1);
  }

  const firstObject = text.indexOf("{");
  const lastObject = text.lastIndexOf("}");

  if (firstObject !== -1 && lastObject > firstObject) {
    return text.slice(firstObject, lastObject + 1);
  }

  return null;
}

export function parseJsonFromModelText(text) {
  const direct = safeJsonParse(text);

  if (direct !== null) {
    return direct;
  }

  const extracted = extractJsonBlock(text);

  if (!extracted) {
    return null;
  }

  return safeJsonParse(extracted);
}
