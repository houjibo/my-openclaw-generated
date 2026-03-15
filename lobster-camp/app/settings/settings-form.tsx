"use client";

import { useState } from "react";
import { AvatarUpload } from "@/components/avatar-upload";
import { toast } from "sonner";

interface SettingsFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    bio: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || "");
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    // 自动保存头像URL到表单
    toast.success("头像已更新，请保存更改");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("name", name);
      formData.append("bio", bio);
      formData.append("avatar", avatarUrl);

      const response = await fetch("/api/user", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      toast.success("个人资料已保存！");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 头像上传区域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          头像
        </label>
        <AvatarUpload
          currentAvatar={avatarUrl}
          userName={name}
          onUploadSuccess={handleAvatarUpload}
        />
        {/* 隐藏的头像URL字段 */}
        <input type="hidden" name="avatar" value={avatarUrl} />
      </div>

      {/* 昵称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          昵称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 个人简介 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          个人简介
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="介绍一下自己..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 保存按钮 */}
      <button
        type="submit"
        disabled={isSaving}
        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "保存中..." : "保存更改"}
      </button>
    </form>
  );
}
