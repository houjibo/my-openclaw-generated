"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadZoneProps {
  onUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  onRemoveFile: (index: number) => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
}

export interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  documentId?: string;
}

const SUPPORTED_FORMATS: Record<string, string[]> = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/markdown": [".md", ".markdown"],
  "text/html": [".html", ".htm"],
  "application/json": [".json"],
};

const FORMAT_LABELS: Record<string, string> = {
  docx: "Word 文档",
  pdf: "PDF 文档",
  pptx: "PowerPoint 演示文稿",
  txt: "文本文件",
  md: "Markdown 文档",
  html: "HTML 文件",
  json: "JSON 文件",
};

export function FileUploadZone({
  onUpload,
  uploadedFiles,
  onRemoveFile,
  maxSize = 50 * 1024 * 1024, // 50MB default
  accept = SUPPORTED_FORMATS,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      multiple: true,
    });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 hover:border-slate-400"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragActive ? "bg-blue-100" : "bg-slate-100"}
          `}
          >
            <Upload
              className={`w-8 h-8 ${
                isDragActive ? "text-blue-600" : "text-slate-400"
              }`}
            />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isDragActive ? "松开以上传文件" : "拖拽文件到此处"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              或点击选择文件
            </p>
          </div>
          <div className="text-xs text-slate-400">
            <p>支持格式：DOCX, PDF, PPTX, TXT, MD, HTML, JSON</p>
            <p>最大文件大小：{formatFileSize(maxSize)}</p>
          </div>
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">以下文件无法上传：</p>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {fileRejections.map(({ file, errors }, index) => (
                  <li key={index}>
                    {file.name} -
                    {errors.map((e) => e.message).join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-700">已选择的文件</h3>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-shrink-0">
                  <File className="w-8 h-8 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      {
                        FORMAT_LABELS[
                          getFileExtension(uploadedFile.file.name)
                        ] || "未知格式"
                      }
                    </span>
                    <span>•</span>
                    <span>{formatFileSize(uploadedFile.file.size)}</span>
                  </div>
                  {uploadedFile.status === "uploading" && (
                    <div className="mt-2">
                      <Progress
                        value={uploadedFile.progress}
                        className="h-1"
                      />
                    </div>
                  )}
                  {uploadedFile.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadedFile.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {uploadedFile.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {uploadedFile.status !== "uploading" && (
                    <button
                      onClick={() => onRemoveFile(index)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
