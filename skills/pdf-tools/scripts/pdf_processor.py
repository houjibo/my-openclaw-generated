#!/usr/bin/env python3
"""
PDF 处理工具
"""

from PyPDF2 import PdfReader, PdfWriter
import sys
import json

def read_pdf(file_path):
    """读取 PDF 内容"""

    try:
        reader = PdfReader(file_path)

        result = {
            'pages': [],
            'metadata': {},
            'page_count': len(reader.pages)
        }

        # 提取每页文本
        for page in reader.pages:
            result['pages'].append({
                'page_number': result['page_count'] - len(reader.pages) + result['pages'].count('pages'),
                'text': page.extract_text()
            })

        # 元数据
        if reader.metadata:
            result['metadata'] = dict(reader.metadata)

        return result

    except Exception as e:
        return {'error': str(e)}

def merge_pdfs(input_files, output_path):
    """合并多个 PDF"""

    try:
        writer = PdfWriter()

        for file_path in input_files:
            reader = PdfReader(file_path)
            for page in reader.pages:
                writer.add_page(page)

        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        return {
            'success': True,
            'output_path': output_path,
            'merged_count': len(input_files)
        }

    except Exception as e:
        return {'error': str(e)}

def split_pdf(file_path, output_dir):
    """拆分 PDF 每页单独保存"""

    try:
        reader = PdfReader(file_path)
        output_files = []

        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)

            output_path = f"{output_dir}/page_{i+1}.pdf"
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)

            output_files.append(output_path)

        return {
            'success': True,
            'output_files': output_files,
            'page_count': len(output_files)
        }

    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'Usage: pdf_reader.py <file_path> | pdf_merger.py <file1,file2,...> <output> | pdf_splitter.py <file_path> <output_dir>'
        }, ensure_ascii=False))
        sys.exit(1)

    operation = sys.argv[1]

    if operation == 'read':
        file_path = sys.argv[2]
        result = read_pdf(file_path)
    elif operation == 'merge':
        files = sys.argv[2].split(',')
        output_path = sys.argv[3]
        result = merge_pdfs(files, output_path)
    elif operation == 'split':
        file_path = sys.argv[2]
        output_dir = sys.argv[3]
        result = split_pdf(file_path, output_dir)
    else:
        result = {'error': f'Unknown operation: {operation}'}

    print(json.dumps(result, ensure_ascii=False, indent=2))
