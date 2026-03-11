---
name: pdf-tools
description: PDF 文档处理工具，支持读取文本、合并多个 PDF、拆分 PDF 每页单独保存。使用 PyPDF2 处理 PDF 文档。适用于需要操作 PDF 文件的场景：提取文本内容、合并多个文档、拆分页面、批量处理 PDF。
---

# PDF 处理工具

## 概述

使用 PyPDF2 库处理 PDF 文档。支持读取文本内容、合并多个 PDF 文件、将 PDF 拆分为单独页面。

## 核心功能

### 1. 读取 PDF

提取 PDF 文件的文本内容和元数据：

```bash
python3 scripts/pdf_processor.py read <file_path>
```

**返回内容：**
- 每页的文本内容
- 页面数量
- PDF 元数据（标题、作者、创建日期等）

### 2. 合并 PDF

将多个 PDF 文件合并为一个：

```bash
python3 scripts/pdf_processor.py merge <file1.pdf,file2.pdf,...> <output_path>
```

**示例：**
```bash
python3 scripts/pdf_processor.py merge chapter1.pdf,chapter2.pdf,chapter3.pdf full_book.pdf
```

### 3. 拆分 PDF

将 PDF 的每一页拆分为独立文件：

```bash
python3 scripts/pdf_processor.py split <file_path> <output_dir>
```

**示例：**
```bash
python3 scripts/pdf_processor.py split document.pdf /tmp/pages/
```

生成文件：`page_1.pdf`, `page_2.pdf`, `page_3.pdf`, ...

## 使用场景

### 场景 1：提取文本
用户说："读取这个 PDF，提取所有文本内容"
1. 运行 `pdf_processor.py read`
2. 解析返回的 JSON
3. 将每页文本整理成可读格式
4. 返回给用户

### 场景 2：合并文档
用户提供多个 PDF 章节文件，要求合并：
1. 收集所有文件路径
2. 用逗号连接文件路径
3. 运行 `pdf_processor.py merge`
4. 返回合并后的文件路径

### 场景 3：拆分页面
用户说："把这个 PDF 的每一页拆分成单独的文件"
1. 运行 `pdf_processor.py split`
2. 返回生成的文件列表
3. 告知用户输出目录和文件数量

### 场景 4：批量处理
用户有多个 PDF 需要提取文本：
1. 遍历所有 PDF 文件
2. 对每个文件运行 `pdf_processor.py read`
3. 合并所有文本内容
4. 保存到文本文件或 Word 文档

## 资源

### scripts/
- `pdf_processor.py` - PDF 处理脚本（读取、合并、拆分）

## 注意事项

- 读取 PDF 文本时，复杂布局可能导致文本顺序混乱
- 合并 PDF 时，保持原始页面顺序
- 拆分 PDF 时，输出文件命名为 `page_1.pdf`, `page_2.pdf` 等
