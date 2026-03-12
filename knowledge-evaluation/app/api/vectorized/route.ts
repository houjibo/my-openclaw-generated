import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { documentVectorizer, ChunkingStrategy } from '@/lib/vectorization';

// GET /api/vectorized?documentId=xxx - 获取文档的向量化记录
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const vectorizedDocs = await prisma.vectorizedDocument.findMany({
      where: { documentId },
      orderBy: { vectorizedAt: 'desc' },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    return NextResponse.json({
      vectorizedDocuments: vectorizedDocs.map((doc) => ({
        id: doc.id,
        documentId: doc.documentId,
        documentVersionId: doc.documentVersionId,
        version: doc.version,
        embeddingModel: doc.embeddingModel,
        chunkingStrategy: doc.chunkingStrategy,
        totalChunks: doc.totalChunks,
        totalTokens: doc.totalTokens,
        vectorizedAt: doc.vectorizedAt,
        chunksCount: doc._count.chunks,
      })),
    });
  } catch (error) {
    console.error('Get vectorized documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/vectorized - 创建向量化
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      documentId,
      chunkingStrategy,
      embeddingModel = 'text-embedding-3-small',
    } = body;

    if (!documentId || !chunkingStrategy) {
      return NextResponse.json(
        { error: 'Document ID and chunking strategy are required' },
        { status: 400 }
      );
    }

    // 获取文档内容
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!document.rawContent) {
      return NextResponse.json(
        { error: 'Document has no content to vectorize' },
        { status: 400 }
      );
    }

    // 执行向量化
    const result = await documentVectorizer.vectorizeDocument(
      documentId,
      document.rawContent,
      {
        embeddingModel,
        chunkingStrategy: chunkingStrategy as ChunkingStrategy,
      }
    );

    return NextResponse.json({
      vectorizedDocumentId: result.vectorizedDocumentId,
      totalChunks: result.totalChunks,
      totalTokens: result.totalTokens,
      embeddingModel: result.embeddingModel,
      message: 'Document vectorized successfully',
    });
  } catch (error) {
    console.error('Vectorize document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/vectorized?id=xxx - 删除向量化
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Vectorized document ID is required' },
        { status: 400 }
      );
    }

    await documentVectorizer.deleteVectorization(id);

    return NextResponse.json({
      message: 'Vectorized document deleted successfully',
    });
  } catch (error) {
    console.error('Delete vectorized document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
