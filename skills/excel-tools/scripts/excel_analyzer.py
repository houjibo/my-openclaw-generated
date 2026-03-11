#!/usr/bin/env python3
"""
Excel 数据分析和处理工具
"""

import pandas as pd
import json
import sys

def analyze_excel(file_path):
    """分析 Excel 文件"""
    try:
        # 读取 Excel
        df = pd.read_excel(file_path)

        result = {
            'shape': df.shape,
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'statistics': {},
            'sample': df.head(10).to_dict(orient='records'),
            'missing_values': df.isnull().sum().to_dict(),
        }

        # 数值列的统计
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        for col in numeric_cols:
            result['statistics'][col] = {
                'count': int(df[col].count()),
                'mean': float(df[col].mean()) if df[col].count() > 0 else None,
                'std': float(df[col].std()) if df[col].count() > 0 else None,
                'min': float(df[col].min()),
                'max': float(df[col].max()),
                'median': float(df[col].median()) if df[col].count() > 0 else None,
            }

        return result

    except Exception as e:
        return {'error': str(e)}

def process_excel(file_path, operations):
    """处理 Excel 文件"""
    try:
        df = pd.read_excel(file_path)
        results = []

        # 数据清洗
        if 'drop_duplicates' in operations:
            before = len(df)
            df = df.drop_duplicates()
            after = len(df)
            results.append({
                'operation': 'drop_duplicates',
                'before': before,
                'after': after,
                'removed': before - after
            })

        if 'fillna' in operations:
            df = df.fillna(operations['fillna'])
            results.append({
                'operation': 'fillna',
                'value': operations['fillna']
            })

        # 数据转换
        if 'groupby' in operations:
            group_col = operations['groupby']
            agg_func = operations.get('agg', 'sum')
            df_grouped = df.groupby(group_col).agg(agg_func)
            results.append({
                'operation': 'groupby',
                'groupby': group_col,
                'agg': agg_func,
                'result': df_grouped.to_dict()
            })

        # 保存
        output_path = operations.get('output_path', '/tmp/output.xlsx')
        df.to_excel(output_path, index=False)
        results.append({
            'operation': 'save',
            'output_path': output_path,
            'rows': len(df),
            'columns': len(df.columns)
        })

        return {'success': True, 'results': results}

    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Usage: excel_analyzer.py <file_path> [json_operations]'
        }, ensure_ascii=False))
        sys.exit(1)

    file_path = sys.argv[1]

    if len(sys.argv) > 2:
        json_ops = sys.argv[2]
        try:
            operations = json.loads(json_ops)
            result = process_excel(file_path, operations)
        except json.JSONDecodeError as e:
            result = {'error': f'Invalid JSON: {str(e)}'}
    else:
        result = analyze_excel(file_path)

    print(json.dumps(result, ensure_ascii=False, indent=2))
