"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteTestSuiteButtonProps {
  testSuiteId: string;
}

export function DeleteTestSuiteButton({
  testSuiteId,
}: DeleteTestSuiteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个评测集吗？此操作不可恢复。")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/test-suites/${testSuiteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast.success("评测集已删除");
      router.push("/test-suites");
    } catch (error) {
      toast.error("删除评测集失败");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      删除
    </button>
  );
}
