import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DocumentCardProps {
  document: {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number | null;
    parseStatus: string;
    metadata: {
      wordCount?: number;
      charCount?: number;
      language?: string;
      pageCount?: number;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

function getFileIcon(fileType: string) {
  const iconMap: Record<string, string> = {
    docx: "📄",
    pdf: "📑",
    pptx: "📊",
    txt: "📝",
    md: "📝",
    html: "🌐",
    json: "📋",
  };
  return iconMap[fileType.toLowerCase()] || "📄";
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "success":
      return "解析成功";
    case "failed":
      return "解析失败";
    default:
      return "解析中";
  }
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Link href={`/documents/${document.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getFileIcon(document.fileType)}</span>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg line-clamp-2">
                  {document.filename}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs uppercase">
                    {document.fileType}
                  </Badge>
                  <span>{formatFileSize(document.fileSize)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {document.metadata && (
              <div className="flex flex-wrap gap-2 text-sm">
                {document.metadata.wordCount && (
                  <span className="text-muted-foreground">
                    {document.metadata.wordCount.toLocaleString()} 字
                  </span>
                )}
                {document.metadata.pageCount && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {document.metadata.pageCount} 页
                    </span>
                  </>
                )}
                {document.metadata.language && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {document.metadata.language === "zh" ? "中文" : "英文"}
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(document.parseStatus)}
                <span className="text-muted-foreground">
                  {getStatusText(document.parseStatus)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(document.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
