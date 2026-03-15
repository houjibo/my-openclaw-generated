"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
}

export function AvatarUpload({
  currentAvatar,
  userName,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("请选择有效的图片文件 (JPEG, PNG, GIF, WebP)");
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超过 5MB");
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "avatar");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const data = await response.json();

      toast.success("头像上传成功！");

      // 调用成功回调
      if (onUploadSuccess) {
        onUploadSuccess(data.url);
      }

      // 清除预览和选中的文件
      setPreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {/* 头像预览 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {displayImage ? (
              <img
                src={displayImage}
                alt={userName || "头像"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Upload className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* 清除按钮 */}
          {preview && !isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* 上传中指示器 */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />

          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            选择图片
          </label>

          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上传中...
                </>
              ) : (
                "上传头像"
              )}
            </button>
          )}
        </div>
      </div>

      {/* 文件信息 */}
      {selectedFile && (
        <p className="text-sm text-gray-500">
          已选择: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {/* 提示信息 */}
      <p className="text-xs text-gray-400">
        支持 JPEG、PNG、GIF、WebP 格式，最大 5MB
      </p>
    </div>
  );
}
