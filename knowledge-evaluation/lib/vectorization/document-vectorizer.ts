import { prisma } from '@/lib/db';
import OpenAI from 'openai';

export interface ChunkingStrategy {
  type: 'fixed' | 'semantic' | 'paragraph';
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

export interface VectorizationOptions {
  embeddingModel?: string;
  chunkingStrategy: ChunkingStrategy;
  maxTokensPerChunk?: number;
}

export interface Chunk {
  content: string;
  position: number;
  tokenCount?: number;
  embedding?: number[];
}

export interface VectorizationResult {
  vectorizedDocumentId: string;
  totalChunks: number;
  totalTokens: number;
  embeddingModel: string;
  chunks: Chunk[];
}

interface EmbeddingClient {
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
}

class OpenAIEmbeddingClient implements EmbeddingClient {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });

      batch.forEach((_, index) => {
        results.push(response.data[index].embedding);
      });
    }

    return results;
  }

  getDimension(): number {
    // OpenAI text-embedding-3-small: 1536
    return 1536;
  }
}

class OllamaEmbeddingClient implements EmbeddingClient {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.EMBEDDING_MODEL || 'qwen-embedding:0.6b';
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];

    for (const text of texts) {
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      results.push(data.embedding);
    }

    return results;
  }

  async getDimension(): Promise<number> {
    // 通过实际请求获取向量维度
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: 'test',
      }),
    });

    const data = await response.json();
    return data.embedding.length;
  }
}

export class DocumentVectorizer {
  private client: EmbeddingClient;
  private defaultModel: string;
  private embeddingProvider: 'openai' | 'ollama';

  constructor() {
    this.embeddingProvider = (process.env.EMBEDDING_PROVIDER as 'openai' | 'ollama') || 'openai';

    if (this.embeddingProvider === 'ollama') {
      this.client = new OllamaEmbeddingClient();
    } else {
      this.client = new OpenAIEmbeddingClient();
    }

    this.defaultModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  }

  async vectorizeDocument(
    documentId: string,
    content: string,
    options: VectorizationOptions
  ): Promise<VectorizationResult> {
    const embeddingModel = options.embeddingModel || this.defaultModel;

    // 1. 分块
    const chunks = this.chunkDocument(content, options.chunkingStrategy);

    // 2. 计算token数量
    const chunksWithTokens = chunks.map((chunk) => ({
      ...chunk,
      tokenCount: this.estimateTokens(chunk.content),
    }));

    // 3. 生成embedding
    const chunksWithEmbeddings = await this.generateEmbeddings(
      chunksWithTokens,
      embeddingModel
    );

    // 4. 获取向量维度
    const embeddingDimension = await this.client.getDimension();

    // 4. 获取文档版本
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const latestVersion = document.versions[0];

    // 5. 保存向量化结果
    const vectorizedDoc = await prisma.vectorizedDocument.create({
      data: {
        documentId,
        documentVersionId: latestVersion?.id,
        version: new Date().toISOString(),
        embeddingModel,
        chunkingStrategy: options.chunkingStrategy as any,
        embeddingDimension,
        totalChunks: chunksWithEmbeddings.length,
        totalTokens: chunksWithEmbeddings.reduce(
          (sum, chunk) => sum + (chunk.tokenCount || 0),
          0
        ),
      },
    });

    // 6. 保存chunks到数据库
    await Promise.all(
      chunksWithEmbeddings.map(async (chunk, index) => {
        await prisma.$executeRaw`
          INSERT INTO "VectorChunk" (id, "vectorizedDocumentId", content, embedding, position, "tokenCount", "createdAt")
          VALUES (
            ${crypto.randomUUID()},
            ${vectorizedDoc.id},
            ${chunk.content},
            ${chunk.embedding}::vector,
            ${chunk.position},
            ${chunk.tokenCount || 0},
            ${new Date()}
          )
        `;
      })
    );

    return {
      vectorizedDocumentId: vectorizedDoc.id,
      totalChunks: chunksWithEmbeddings.length,
      totalTokens: chunksWithEmbeddings.reduce(
        (sum, chunk) => sum + (chunk.tokenCount || 0),
        0
      ),
      embeddingModel,
      chunks: chunksWithEmbeddings,
    };
  }

  private chunkDocument(content: string, strategy: ChunkingStrategy): Chunk[] {
    switch (strategy.type) {
      case 'fixed':
        return this.fixedSizeChunking(content, strategy);
      case 'semantic':
        return this.semanticChunking(content, strategy);
      case 'paragraph':
        return this.paragraphChunking(content, strategy);
      default:
        return this.fixedSizeChunking(content, strategy);
    }
  }

  private fixedSizeChunking(
    content: string,
    strategy: ChunkingStrategy
  ): Chunk[] {
    const chunkSize = strategy.chunkSize || 1000;
    const chunkOverlap = strategy.chunkOverlap || 200;
    const chunks: Chunk[] = [];

    let position = 0;
    while (position < content.length) {
      const end = Math.min(position + chunkSize, content.length);
      const chunk = content.slice(position, end);

      chunks.push({
        content: chunk,
        position,
      });

      position += chunkSize - chunkOverlap;
    }

    return chunks;
  }

  private semanticChunking(content: string, strategy: ChunkingStrategy): Chunk[] {
    // 基于语义的分块：按句子边界分割，确保每个chunk语义完整
    const maxChunkSize = strategy.chunkSize || 1000;
    const sentences = content.split(/(?<=[。！？.!?])\s+/);
    const chunks: Chunk[] = [];

    let currentChunk = '';
    let position = 0;
    let chunkStart = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            position: chunkStart,
          });
        }
        currentChunk = sentence;
        chunkStart = position;
      } else {
        currentChunk += sentence;
      }
      position += sentence.length;
    }

    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        position: chunkStart,
      });
    }

    return chunks;
  }

  private paragraphChunking(content: string, strategy: ChunkingStrategy): Chunk[] {
    const paragraphs = content.split(/\n\n+/);
    const maxChunkSize = strategy.chunkSize || 2000;
    const chunks: Chunk[] = [];

    let currentChunk = '';
    let position = 0;
    let chunkStart = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push({
            content: currentChunk.trim(),
            position: chunkStart,
          });
        }
        currentChunk = paragraph + '\n\n';
        chunkStart = position;
      } else {
        currentChunk += paragraph + '\n\n';
      }
      position += paragraph.length + 2;
    }

    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        position: chunkStart,
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    // 简单的token估算：英文约4字符/token，中文约1.5字符/token
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - englishChars - chineseChars;

    return Math.ceil(englishChars / 4 + chineseChars / 1.5 + otherChars / 4);
  }

  private async generateEmbeddings(
    chunks: Chunk[],
    model: string
  ): Promise<Chunk[]> {
    return this.client.generateEmbeddings(
      chunks.map((chunk) => chunk.content)
    ).then((embeddings) => {
      return chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      }));
    });
  });

  async searchSimilar(
    query: string,
    vectorizedDocumentId: string,
    topK: number = 5
  ): Promise<Array<{ chunk: Chunk; similarity: number }>> {
    // 生成查询的embedding
    const embeddings = await this.client.generateEmbeddings([query]);
    const queryVector = embeddings[0];

    // 执行向量相似度搜索
    const results = await prisma.$queryRaw`
      SELECT 
        vc.id,
        vc.content,
        vc.position,
        vc."tokenCount",
        1 - (vc.embedding <=> ${queryVector}::vector) as similarity
      FROM "VectorChunk" vc
      WHERE vc."vectorizedDocumentId" = ${vectorizedDocumentId}
      ORDER BY vc.embedding <=> ${queryVector}::vector
      LIMIT ${topK}
    `;

    return (results as any[]).map((row) => ({
      chunk: {
        content: row.content,
        position: row.position,
        tokenCount: row.tokenCount,
      },
      similarity: row.similarity,
    }));
  }

  async deleteVectorization(vectorizedDocumentId: string): Promise<void> {
    await prisma.vectorizedDocument.delete({
      where: { id: vectorizedDocumentId },
    });
  }
}

export const documentVectorizer = new DocumentVectorizer();
