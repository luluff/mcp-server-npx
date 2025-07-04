#!/bin/bash

# 自动发布脚本
# 功能：版本升级、推送代码、发布到npm

set -e  # 遇到错误立即退出

echo "🚀 开始发布流程..."

# 1. 升级版本
echo "📦 升级版本..."
npm version patch

# 2. 推送代码和标签
echo "🔄 推送代码和标签..."
git push --follow-tags

# 3. 发布到npm
echo "📤 发布到npm..."
npm publish --access public

echo "✅ 发布完成！"