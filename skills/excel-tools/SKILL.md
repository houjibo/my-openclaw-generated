---
name: excel-tools
description: Excel 数据分析和处理工具，使用 pandas 进行数据读取、清洗、转换和分析。支持统计分析、数据透视、去重、填充空值、数据聚合。适用于需要处理电子表格数据的场景：数据分析、报表生成、数据清洗、批量处理 Excel 文件。
---

# Excel 数据分析工具

## 概述

使用 pandas 和 openpyxl 库处理 Excel (.xlsx, .xls) 文件。支持数据读取、清洗、转换、分析和统计。

## 核心功能

### 1. 分析数据

分析 Excel 文件的结构和统计信息：

```bash
python3 scripts/excel_analyzer.py <file_path>
```

**返回内容：**
- 数据维度（行数、列数）
- 列名和数据类型
- 数值列的统计信息（均值、标准差、最大值、最小值、中位数）
- 缺失值统计
- 前 10 行数据样本

### 2. 处理数据

执行数据清洗和转换操作：

```bash
python3 scripts/excel_analyzer.py <file_path> <json_operations>
```

**支持的操作：**
- `drop_duplicates`: 删除重复行
- `fillna`: 填充缺失值
- `groupby`: 按列分组聚合
- `output_path`: 输出文件路径

**JSON 格式：**
```json
{
  "drop_duplicates": true,
  "fillna": 0,
  "groupby": "category",
  "agg": "sum",
  "output_path": "/tmp/output.xlsx"
}
```

## 使用场景

### 场景 1：数据分析
用户说："分析这个 Excel 文件，告诉我销售额的统计信息"
1. 运行 `excel_analyzer.py`（不带操作参数）
2. 解析返回的统计数据
3. 向用户报告分析结果

### 场景 2：数据清洗
用户提供包含重复和缺失值的 Excel 文件：
1. 运行 `excel_analyzer.py`，传入 `drop_duplicates` 和 `fillna` 操作
2. 返回清洗后的文件路径
3. 告知用户删除了多少重复行

### 场景 3：数据透视
用户说："按产品类别汇总销售额"
1. 运行 `excel_analyzer.py`，传入 `groupby` 和 `agg` 参数
2. 返回分组聚合结果
3. 将结果保存为新文件

### 场景 4：多文件处理
用户有多个 Excel 文件需要合并：
1. 用 pandas 读取所有文件
2. 使用 `pd.concat()` 合并
3. 保存为新的 Excel 文件

## 资源

### scripts/
- `excel_analyzer.py` - 数据分析和处理核心脚本
