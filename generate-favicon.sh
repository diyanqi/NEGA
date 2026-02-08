#!/bin/bash
# NEGA Favicon 生成脚本
# 使用此脚本从SVG生成多种格式的favicon文件

# 前置要求: ImageMagick (convert 命令)
# 安装: sudo apt-get install imagemagick

set -e

echo "🎨 NEGA Favicon 生成工具"
echo "================================"

# 设置项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"

# 检查 public 目录是否存在
if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ 错误: public 目录不存在"
    echo "请确保您在项目根目录运行此脚本"
    exit 1
fi

# 检查源文件是否存在
if [ ! -f "$PUBLIC_DIR/favicon.svg" ]; then
    echo "❌ 错误: $PUBLIC_DIR/favicon.svg 不存在"
    echo "请确保 favicon.svg 文件在 public/ 目录中"
    exit 1
fi

# 检查ImageMagick是否安装
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick 未安装"
    echo "请运行: sudo apt-get install imagemagick"
    exit 1
fi

echo "✅ ImageMagick 已安装"
echo "📂 项目目录: $PROJECT_DIR"
echo ""
echo "📦 生成favicon文件..."

cd "$PUBLIC_DIR"

# 生成 icon-192x192.png
convert favicon.svg -density 300 -resize 192x192 icon-192x192.png 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ icon-192x192.png"
else
    echo "⚠ icon-192x192.png 生成失败"
fi

# 生成 icon-512x512.png
convert favicon.svg -density 300 -resize 512x512 icon-512x512.png 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ icon-512x512.png"
else
    echo "⚠ icon-512x512.png 生成失败"
fi

# 生成 apple-touch-icon.png (180x180)
convert favicon.svg -density 300 -resize 180x180 apple-touch-icon.png 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ apple-touch-icon.png"
else
    echo "⚠ apple-touch-icon.png 生成失败"
fi

# 生成 favicon.ico (多尺寸)
convert favicon.svg -density 300 -define icon:auto-resize=64,48,32,16 favicon.ico 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ favicon.ico"
else
    echo "⚠ favicon.ico 生成失败"
fi

# 生成 favicon-32x32.png
if [ -f "favicon-32x32.svg" ]; then
    convert favicon-32x32.svg -density 300 -resize 32x32 favicon-32x32.png 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ favicon-32x32.png"
    else
        echo "⚠ favicon-32x32.png 生成失败"
    fi
fi

# 生成 favicon-16x16.png
if [ -f "favicon-16x16.svg" ]; then
    convert favicon-16x16.svg -density 300 -resize 16x16 favicon-16x16.png 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ favicon-16x16.png"
    else
        echo "⚠ favicon-16x16.png 生成失败"
    fi
fi

# 列出生成的文件
echo ""
echo "✨ Favicon 文件生成完毕!"
echo "================================"
echo "✓ 生成的文件:"
ls -lh *.png *.ico 2>/dev/null | awk '{print "  • " $9 " (" $5 ")"}'
echo ""
echo "📁 所有文件已保存到: $PUBLIC_DIR"
echo "🚀 您现在可以运行 npm run dev 来测试"
