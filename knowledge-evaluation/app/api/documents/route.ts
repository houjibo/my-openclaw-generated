import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ParserFactory } from "@/lib/parsers";
import { saveFile, getMaxFileSize } from "@/lib/file-utils";
import path from "path";

// 支持的文件类型
const SUPPORTED_TYPES = [
  "docx",
  "pdf",
  "txt",
  "md",
  "markdown",
  "html",
  "json",
  "pptx",
];

// 获取文件扩展名
function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(".", "");
}

// 验证文件类型
function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return SUPPORTED_TYPES.includes(ext);
}

// POST /api/documents - 上传并解析文档
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // 验证文件大小
    const maxSize = getMaxFileSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    const fileType = getFileExtension(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    // 保存文件到本地
    const filePath = await saveFile(buffer, file.name);

    // 创建文档记录
    const document = await prisma.document.create({
      data: {
        filename: file.name,
        fileType,
        fileSize: BigInt(file.size),
        filePath,
        parseStatus: "pending",
      },
    });

    // 异步解析文档
    try {
      const parser = ParserFactory.getParser(fileType);
      const result = await parser.parse(buffer, file.name);

      if (result.success) {
        // 更新文档解析结果
        await prisma.document.update({
          where: { id: document.id },
          data: {
            rawContent: result.rawContent,
            structuredContent: result.structuredContent as any,
            metadata: result.metadata as any,
            parseStatus: "success",
          },
        });

        // 创建初始版本
        await prisma.documentVersion.create({
          data: {
            documentId: document.id,
            version: 1,
            content: result.rawContent,
            structuredContent: result.structuredContent as any,
          },
        });
      } else {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            parseStatus: "failed",
            parseError: result.error || "Unknown parsing error",
          },
        });
      }
    } catch (parseError) {
      await prisma.document.update({
        where: { id: document.id },
        data: {
          parseStatus: "failed",
          parseError:
            parseError instanceof Error
              ? parseError.message
              : "Parsing failed",
        },
      });
    }

    return NextResponse.json(
      {
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        parseStatus: document.parseStatus,
        createdAt: document.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/documents - 获取文档列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where = status ? { parseStatus: status } : {};

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          fileType: true,
          fileSize: true,
          parseStatus: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents: documents.map((doc) => ({
        ...doc,
        fileSize: doc.fileSize ? Number(doc.fileSize) : null,
        metadata: doc.metadata as any,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
