// Powered by OnSpace.AI
import { RagDocument } from './storageService';

export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Simple TF-IDF based retrieval (no external embedding model needed)
function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\sáéíóúâêîôûãõçàèìòùü]/g, '').split(/\s+/).filter(Boolean);
}

function tfidf(query: string[], doc: string[]): number {
  const querySet = new Set(query);
  const docSet = new Set(doc);
  let score = 0;
  for (const term of querySet) {
    if (docSet.has(term)) {
      const tf = doc.filter((t) => t === term).length / doc.length;
      score += tf;
    }
  }
  return score;
}

export function retrieveRelevant(query: string, documents: RagDocument[], topK = 3): string[] {
  if (documents.length === 0) return [];
  const queryTokens = tokenize(query);
  const allChunks: { text: string; score: number }[] = [];

  for (const doc of documents) {
    const chunks = chunkText(doc.content, 600, 80);
    for (const chunk of chunks) {
      const docTokens = tokenize(chunk);
      const score = tfidf(queryTokens, docTokens);
      allChunks.push({ text: `[${doc.name}]\n${chunk}`, score });
    }
  }

  return allChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score > 0)
    .map((c) => c.text);
}

export function buildRagContext(query: string, documents: RagDocument[]): string {
  const relevant = retrieveRelevant(query, documents, 3);
  if (relevant.length === 0) return '';
  return `\n\n[Contexto dos documentos carregados]\n${relevant.join('\n---\n')}\n\n[Responda com base nos documentos acima quando relevante]`;
}

export function estimateTokenCount(text: string): number {
  // Approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export function estimateSessionTokens(messages: Array<{ content: string }>): number {
  return messages.reduce((sum, m) => sum + estimateTokenCount(m.content), 0);
}
