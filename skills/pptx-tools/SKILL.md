---
name: pptx-tools
description: PowerPoint 演示文稿创建工具，支持从结构化数据生成 .pptx 文件。创建标题页、内容页、表格页，自动布局和格式化。适用于需要生成演示文稿的场景：创建报告幻灯片、数据可视化展示、批量生成 PPT。
---

# PowerPoint 创建工具

## 概述

使用 python-pptx 库创建 PowerPoint (.pptx) 演示文稿。支持创建标题页、内容页和表格页。

## 核心功能

### 创建演示文稿

基于 JSON 内容创建 PowerPoint 演示文稿：

```bash
python3 scripts/pptx_creator.py <json_content> [output_path]
```

**JSON 格式：**
```json
{
  "title": "演示文稿标题",
  "subtitle": "副标题或日期",
  "slides": [
    {
      "title": "幻灯片标题",
      "content": "幻灯片内容文本"
    }
  ],
  "tables": [
    {
      "title": "表格页标题",
      "data": [
        ["列1", "列2", "列3"],
        ["数据1", "数据2", "数据3"],
        ["数据4", "数据5", "数据6"]
      ]
    }
  ]
}
```

## 使用场景

### 场景 1：创建标题页
用户提供报告标题，要求创建封面页：
1. 构造包含 `title` 和 `subtitle` 的 JSON
2. 运行 `pptx_creator.py`
3. 返回生成的文件路径

### 场景 2：数据转 PPT
用户提供 Excel 数据，要求转换成演示文稿：
1. 从 Excel 读取数据
2. 构造 `tables` 数组，包含表格数据
3. 运行 `pptx_creator.py`
4. 返回生成的 PPTX 文件

### 场景 3：批量生成幻灯片
用户提供多个主题，每个主题一页：
1. 为每个主题构造 `slides` 数组元素
2. 运行 `pptx_creator.py`
3. 返回生成的演示文稿

### 场景 4：混合内容
用户需要包含文本和表格的综合演示文稿：
1. 在 JSON 中同时使用 `slides` 和 `tables`
2. 运行 `pptx_creator.py`
3. 返回包含多种页面类型的 PPTX

## 资源

### scripts/
- `pptx_creator.py` - PowerPoint 演示文稿创建脚本
