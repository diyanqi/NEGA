# NEGA SEO优化 - 快速参考

## 📋 文件快速导航

### 核心SEO文件

| 文件 | 位置 | 用途 |
|------|------|------|
| **layout.tsx** | `src/app/layout.tsx` | 全局Meta标签、Open Graph、Robots配置 |
| **robots.ts** | `src/app/robots.ts` | 自动生成Robots.txt (Next.js) |
| **sitemap.ts** | `src/app/sitemap.ts` | 自动生成Sitemap (Next.js) |
| **manifest.ts** | `src/app/manifest.ts` | Web App清单、Icon配置 |
| **next.config.ts** | `next.config.ts` | 图像优化、安全头部、国际化 |

### SEO工具库

| 文件 | 位置 | 用途 |
|------|------|------|
| **seo-config.ts** | `src/lib/seo-config.ts` | 全局SEO配置、关键词库 |
| **meta-tags.ts** | `src/lib/meta-tags.ts` | Meta标签生成工具 |
| **schema-org.tsx** | `src/lib/schema-org.tsx` | 结构化数据、JSON-LD组件 |

### 静态资源

| 文件 | 位置 | 尺寸 | 用途 |
|------|------|------|------|
| **robots.txt** | `public/robots.txt` | - | 爬虫指导规则 |
| **sitemap.xml** | `public/sitemap.xml` | - | 主Sitemap |
| **sitemap-en.xml** | `public/sitemap-en.xml` | - | 英文Sitemap |
| **sitemap-zh.xml** | `public/sitemap-zh.xml` | - | 中文Sitemap |
| **logo-with-text.svg** | `public/logo-with-text.svg` | 240x80 | 完整品牌Logo |
| **icon-logo.svg** | `public/icon-logo.svg` | 64x64 | 品牌图标/Favicon |
| **og-image.svg** | `public/og-image.svg` | 1200x630 | 社交分享图 |
| **favicon.svg** | `public/favicon.svg` | 64x64 | 浏览器标签图标 |

### 文档和指南

| 文件 | 位置 | 内容 |
|------|------|------|
| **SEO-GUIDE.md** | `SEO-GUIDE.md` | 详细的SEO优化指南和最佳实践 |
| **SEO-CHECKLIST.md** | `SEO-CHECKLIST.md` | SEO检查清单、部署指南 |
| **BRAND-GUIDELINES.md** | `BRAND-GUIDELINES.md` | 品牌指南、视觉标识规范 |
| **SEO-OPTIMIZATION-SUMMARY.md** | `SEO-OPTIMIZATION-SUMMARY.md` | 本次优化的完整总结 |

---

## 🚀 快速开始

### 1. 部署优化版本
```bash
cd /workspaces/NEGA
npm run build
npm run start
```

### 2. 验证SEO文件
```bash
# 检查Robots.txt
curl https://negaapp.com/robots.txt

# 检查Sitemap
curl https://negaapp.com/sitemap.xml

# 检查Logo
# 访问: https://negaapp.com/logo-with-text.svg
```

### 3. 提交搜索引擎
```
Google Search Console: https://search.google.com/search-console
Bing Webmaster Tools: https://www.bing.com/webmasters
```

---

## 🎯 关键配置项

### Meta标签位置
```
位置: src/app/layout.tsx (第25-75行)

关键keywords:
- "English Grammar"
- "Grammar Assistant"
- "英文语法"
- "口语教练"
```

### Logo使用
```
完整Logo (带文字):
  public/logo-with-text.svg
  → 用于网站Header
  
仅图标 (24x24-512x512):
  public/icon-logo.svg
  → 用于Favicon、社交媒体头像
```

### 配色方案
```
品牌蓝: #0066FF
浅蓝: #00D4FF
温暖橙: #FFA24C
深红: #FF6B6B
```

---

## ✨ 高级用法速查

### 在页面中使用Meta标签
```typescript
// 方式1: 使用预配置
import { pageMetaTags } from "@/lib/meta-tags";
export const metadata = pageMetaTags.home.en;

// 方式2: 自定义生成
import { generateMetaTags } from "@/lib/meta-tags";
export const metadata = generateMetaTags({
  title: "Your Title",
  description: "Your description",
  keywords: ["keyword1", "keyword2"],
  slug: "your-page"
});
```

### 在页面中添加Schema
```typescript
import { JsonLD, webApplicationSchema } from "@/lib/schema-org";

export default function Page() {
  return (
    <>
      <JsonLD data={webApplicationSchema} />
      {/* 页面内容 */}
    </>
  );
}
```

### 访问SEO配置
```typescript
import seoConfig from "@/lib/seo-config";

// 使用关键词
const keywords = seoConfig.keywords.en;
// 使用社交链接
const twitter = seoConfig.socialLinks.twitter;
```

---

## 📊 性能检查

### Lighthouse检查
```bash
# 使用Chrome DevTools
右键 → 检查 → Lighthouse

目标:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: 100
```

### 搜索引擎测试工具

| 工具 | URL |
|------|-----|
| 谷歌Rich Results | https://search.google.com/test/rich-results |
| 谷歌Mobile友好 | https://search.google.com/test/mobile-friendly |
| 谷歌PageSpeed | https://pagespeed.web.dev/ |
| Facebook分享 | https://developers.facebook.com/tools/debug/ |
| Twitter Card | https://cards-dev.twitter.com/validator |

---

## 📱 社交媒体资源

### 推荐的OG图片
```
大小: 1200 x 630 像素
格式: PNG或JPG
位置: public/og-image.png (已有SVG版本)
```

### Logo在社交媒体中的使用
```
Twitter:        64x64px (头像)
LinkedIn:       200x200px (头像)
Facebook:       200x200px (头像)
GitHub:         200x200px (头像)
```

---

## 🔑 关键权值术语

### 英文目标关键词
```
高优先级:
- English Grammar Assistant
- Native English Tutor
- Grammar Checker AI
- Speaking Practice App

中优先级:
- English Learning Platform
- Pronunciation Guide
- AI English Coach
- Language Learning
```

### 中文目标关键词
```
高优先级:
- 英文语法助手
- 口语教练
- 英文发音指导
- 西海岸英文

中优先级:
- AI英文学习
- 英文语法检查
- 在线口语练习
- 英语学习软件
```

---

## 📈 监控指标

### 每周检查项
```
☐ Google Search Console错误
☐ 搜索查询统计
☐ 网站健康状态
☐ 导入错误检查
```

### 每月检查项
```
☐ Google Analytics报告
☐ 流量来源分析
☐ 用户行为分析
☐ 转化率分析
```

### 每季度检查项
```
☐ 完整SEO审计
☐ 竞争对手分析
☐ 关键词排名变化
☐ 内容优化计划
```

---

## 🛠️ 常见任务

### 更新Meta标签
```
文件: src/app/layout.tsx (第25-75行)
修改: metadata对象的title和description
```

### 修改Logo
```
文件: public/logo-with-text.svg 或 public/icon-logo.svg
工具: VSCode或任何SVG编辑器
```

### 更改配色
```
品牌蓝: #0066FF
搜索位置:
  - public/icon-logo.svg
  - public/logo-with-text.svg
  - public/og-image.svg
  - next.config.ts (theme_color)
```

### 添加新页面到Sitemap
```
自动: 如果使用src/app/sitemap.ts
手动: 修改sitemap.ts中的URL列表
```

---

## ⚠️ 常见错误和解决

| 问题 | 原因 | 解决 |
|------|------|------|
| Sitemap 404 | 文件未部署 | 检查public文件夹 |
| Logo显示错误 | SVG路径错误 | 验证文件在public文件夹中 |
| Meta标签未显示 | 配置错误 | 检查layout.tsx的metadata对象 |
| 结构化数据验证失败 | Schema错误 | 使用Rich Results Test工具调试 |

---

## 🎓 推荐阅读

### 官方文档
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org文档](https://schema.org/)

### SEO最佳实践
1. 用户优先，算法其次
2. 高质量内容是基础
3. 技术SEO要规范
4. 定期更新和维护
5. 监控和分析数据

---

## 💬 常见问题

**Q: SEO优化需要多久才能见效?**
A: 通常4-12周。Google爬虫需要时间发现和索引您的网站。

**Q: 我可以修改配色吗?**
A: 可以。所有资源都是editable的SVG文件。

**Q: 如何集成Google Analytics?**
A: 在layout.tsx的head中添加GA脚本。

**Q: 支持多少种语言?**
A: 当前配置支持英文和中文，易于扩展其他语言。

---

## 📞 相关链接

- 🌐 **网站**: https://negaapp.com
- 📧 **邮件**: support@negaapp.com
- 🐦 **Twitter**: @negaapp
- 💼 **LinkedIn**: NEGA
- 🐙 **GitHub**: github.com/negaapp

---

**版本**: 1.0 | **更新**: 2026-02-08 | **状态**: ✅ 完成

