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

export class DocumentVectorizer {
  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
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
    const batchSize = 100; // OpenAI限制每次最多100个文本
    const results: Chunk[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((chunk) => chunk.content);

      const response = await this.client.embeddings.create({
        model,
        input: texts,
      });

      batch.forEach((chunk, index) => {
        results.push({
          ...chunk,
          embedding: response.data[index].embedding,
        });
      });
    }

    return results;
  }

  async searchSimilar(
    query: string,
    vectorizedDocumentId: string,
    topK: number = 5
  ): Promise<Array<{ chunk: Chunk; similarity: number }>> {
    // 生成查询的embedding
    const queryEmbedding = await this.client.embeddings.create({
      model: this.defaultModel,
      input: query,
    });

    const queryVector = queryEmbedding.data[0].embedding;

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
