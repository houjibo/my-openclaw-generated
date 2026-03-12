"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FileUploadZone,
  UploadedFile,
} from "@/components/upload/file-upload-zone";
import { toast } from "sonner";

export default function UploadPage() {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadedFiles((prev) => {
        return prev.map((f, i) =>
          i === index ? { ...f, status: "uploading", progress: 0 } : f
        );
      });

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "上传失败");
      }

      setUploadedFiles((prev) => {
        return prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "success",
                progress: 100,
                documentId: result.id,
              }
            : f
        );
      });

      toast.success(`${file.name} 上传成功`);
      return result.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "上传失败";
      setUploadedFiles((prev) => {
        return prev.map((f, i) =>
          i === index ? { ...f, status: "error", error: errorMessage } : f
        );
      });
      toast.error(`${file.name} 上传失败: ${errorMessage}`);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("请先选择要上传的文件");
      return;
    }

    setIsUploading(true);
    const pendingFiles = uploadedFiles.filter((f) => f.status === "pending");

    if (pendingFiles.length === 0) {
      toast.info("所有文件已上传");
      router.push("/documents");
      return;
    }

    // Upload all pending files
    const uploadPromises = pendingFiles.map((uploadedFile) => {
      const index = uploadedFiles.findIndex(
        (f) => f.file === uploadedFile.file
      );
      return uploadFile(uploadedFile.file, index);
    });

    const results = await Promise.all(uploadPromises);
    setIsUploading(false);

    // Check if all uploads were successful
    const successCount = results.filter(Boolean).length;
    if (successCount === pendingFiles.length) {
      toast.success(`成功上传 ${successCount} 个文件`);
      router.push("/documents");
    } else if (successCount > 0) {
      toast.warning(`上传完成：${successCount} 个成功，${pendingFiles.length - successCount} 个失败`);
    }
  };

  const hasPendingFiles = uploadedFiles.some((f) => f.status === "pending");
  const hasFiles = uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/documents"
            className="inline-flex items-center text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            返回列表
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            上传文档
          </h1>
          <p className="text-slate-600 mb-6">
            上传知识文档以进行质量评估和优化
          </p>

          <FileUploadZone
            onUpload={handleUpload}
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />

          <div className="mt-6 flex items-center justify-end gap-4">
            <Link
              href="/documents"
              className="text-slate-600 hover:text-slate-900"
            >
              取消
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={!hasFiles || (isUploading && !hasPendingFiles)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  开始上传
                  {uploadedFiles.length > 0 && (
                    <span className="ml-2">({uploadedFiles.length})</span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
