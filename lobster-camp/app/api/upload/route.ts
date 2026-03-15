import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { randomBytes } from "crypto";

// 允许的图片类型
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// 最大文件大小 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "avatar" | "image"

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Max size: 5MB" },
        { status: 400 }
      );
    }

    // 确定上传目录
    const uploadDir = type === "avatar" 
      ? join(process.cwd(), "public", "uploads", "avatars")
      : join(process.cwd(), "public", "uploads", "images");

    // 确保目录存在
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const fileExtension = file.name.split(".").pop() || "png";
    const uniqueId = randomBytes(16).toString("hex");
    const fileName = `${uniqueId}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // 读取文件内容并写入
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 生成访问URL
    const publicUrl = type === "avatar"
      ? `/uploads/avatars/${fileName}`
      : `/uploads/images/${fileName}`;

    return Response.json({
      success: true,
      url: publicUrl,
      fileName,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
