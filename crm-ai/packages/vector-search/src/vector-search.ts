import { KnowledgeBaseService } from "@crm-ai/knowledge-base";
import { logger } from "@crm-ai/logger";

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

function textToVector(text: string, dimensions = 128): number[] {
  const vector: number[] = [];
  const lower = text.toLowerCase();

  for (let i = 0; i < dimensions; i++) {
    let hash = 0;
    const seed = i * 31;
    for (let j = 0; j < lower.length; j++) {
      hash = (hash * seed + lower.charCodeAt(j)) % 10000;
    }
    vector.push(hash / 10000);
  }

  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return magnitude === 0 ? vector : vector.map((v) => v / magnitude);
}

export class VectorSearchService {
  private knowledgeBase: KnowledgeBaseService;

  constructor() {
    this.knowledgeBase = new KnowledgeBaseService();
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const queryVector = textToVector(query, 128);

    const docs = await this.knowledgeBase.getDocumentEmbeddings();

    const results: SearchResult[] = [];

    for (const doc of docs) {
      let score: number;
      if (doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0) {
        const docVec = doc.embedding as number[];
        const paddedDoc = docVec.length < 128
          ? [...docVec, ...Array(128 - docVec.length).fill(0)]
          : docVec.slice(0, 128);
        score = cosineSimilarity(queryVector, paddedDoc);
      } else {
        score = this.keywordSimilarity(query, doc.content);
      }

      if (score > 0.1 || docs.length <= topK) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category as string,
          score: Math.round(score * 100) / 100,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private keywordSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const contentLower = content.toLowerCase();
    const matchCount = queryWords.filter((w) => contentLower.includes(w)).length;
    return queryWords.length > 0 ? matchCount / queryWords.length : 0;
  }

  async generateEmbedding(text: string, dimensions = 128): Promise<number[]> {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

      if (!apiKey) {
        return textToVector(text, dimensions);
      }

      const response = await fetch(`${baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          input: text,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.data?.[0]?.embedding) {
          return data.data[0].embedding as number[];
        }
      }
    } catch (err) {
      logger.error({ err }, "VectorSearch: embedding API failed, falling back to local");
    }

    return textToVector(text, dimensions);
  }

  async embedAndIndexDocument(documentId: string): Promise<boolean> {
    try {
      const doc = await this.knowledgeBase.findById(documentId);
      if (!doc) return false;

      const embedding = await this.generateEmbedding(doc.content, 128);
      await this.knowledgeBase.update(documentId, { embedding });
      logger.info({ documentId, dims: embedding.length }, "Document embedded and indexed");
      return true;
    } catch (err) {
      logger.error({ err, documentId }, "Failed to embed and index document");
      return false;
    }
  }

  async embedAllDocuments(): Promise<number> {
    const docs = await this.knowledgeBase.findAll();
    let count = 0;
    for (const doc of docs) {
      const success = await this.embedAndIndexDocument(doc.id);
      if (success) count++;
    }
    return count;
  }

  async buildRAGContext(query: string, topK = 3): Promise<string> {
    const results = await this.search(query, topK);

    if (results.length === 0) return "";

    const parts = ["=== RELEVANT KNOWLEDGE ==="];
    for (const r of results) {
      parts.push(
        `[${r.category}] ${r.title} (relevance: ${r.score}): ${r.content.slice(0, 500)}`
      );
    }

    return parts.join("\n");
  }
}
