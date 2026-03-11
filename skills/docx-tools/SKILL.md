---
name: docx-tools
description: Word 文档处理工具，支持读取、创建和编辑 .docx 文件。提取文档内容、段落和表格数据、替换文本、添加新内容。适用于需要处理专业文档的场景：创建报告、修改文档、提取数据、批量处理文档。
---

# Word 文档处理工具

## 概述

使用 python-docx 库处理 Word (.docx) 文档。支持读取文档内容、创建新文档、编辑现有文档。

## 核心功能

### 1. 读取文档

提取 Word 文档的段落、表格和元数据：

```bash
python3 scripts/docx_reader.py <file_path>
```

**返回内容：**
- 段落文本和样式
- 表格数据
- 文档元数据（段落数、表格数）

### 2. 创建文档

基于 JSON 内容创建新的 Word 文档：

```bash
python3 scripts/docx_creator.py <json_content> [output_path]
```

**JSON 格式：**
```json
{
  "title": "文档标题",
  "paragraphs": [
    {
      "text": "段落文本",
      "style": "Normal"
    }
  ],
  "tables": [
    [
      ["表头1", "表头2"],
      ["数据1", "数据2"]
    ]
  ]
}
```

### 3. 编辑文档

修改现有 Word 文档：

```bash
python3 scripts/docx_editor.py <file_path> <json_edits> [output_path]
```

**支持的操作：**
- `replacements`: 替换文本（键值对）
- `append_text`: 在文档末尾添加文本
- `add_heading`: 添加新标题

**示例 JSON：**
```json
{
  "replacements": {
    "旧文本": "新文本"
  },
  "append_text": "添加的文本",
  "add_heading": {
    "text": "新标题",
    "level": 1
  }
}
```

## 使用场景

### 场景 1：提取文档内容
用户说："读取这个 Word 文档，提取所有段落和表格"
1. 运行 `docx_reader.py`
2. 分析返回的 JSON
3. 总结内容给用户

### 场景 2：批量替换文本
用户说："在这个文档中，把'客户'替换为'合作伙伴'"
1. 运行 `docx_editor.py`，传入 `replacements` 参数
2. 返回编辑后的文件路径

### 场景 3：生成报告
用户提供数据，要求创建 Word 报告：
1. 构造 JSON 结构
2. 运行 `docx_creator.py`
3. 返回生成的文件路径

## 资源

### scripts/
- `docx_reader.py` - 读取 Word 文档内容
- `docx_creator.py` - 创建新 Word 文档
- `docx_editor.py` - 编辑现有 Word 文档
