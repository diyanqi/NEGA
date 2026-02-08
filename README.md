# NEGA - Your Native English Grammar Assistant

<div align="center">
  <img src="public/logo-with-text.svg" alt="NEGA Logo" width="300">
  
  **你的西海岸纯正口语教练** | Your Native English Grammar Assistant

  [![GitHub](https://img.shields.io/badge/GitHub-negaapp-black?logo=github)](https://github.com/negaapp)
  [![Twitter](https://img.shields.io/badge/Twitter-@negaapp-1DA1F2?logo=twitter)](https://twitter.com/negaapp)
  [![Website](https://img.shields.io/badge/Website-negaapp.com-0066FF)](https://negaapp.com)
</div>

## 🎯 About NEGA

NEGA是一个AI驱动的英文语法助手和口语教练，帮助全球英文学习者：

✨ **核心功能**
- 🔍 **实时语法纠正** - AI驱动的精确语法检查
- 🎤 **发音指导** - 西海岸纯正口语发音
- 💬 **口语对话** - 与AI进行自然流畅的英文对话
- 🌍 **双语支持** - 完整的英文和中文用户界面

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm/yarn

### 安装依赖
```bash
cd /workspaces/NEGA
pnpm install
# 或
npm install
```

### 开发模式
```bash
pnpm dev
# 或
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 生产构建
```bash
pnpm build
pnpm start
```

## 📁 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 路由 (chat, transcribe, tts)
│   ├── layout.tsx      # 全局元数据和SEO配置
│   ├── robots.ts       # SEO robots配置
│   ├── sitemap.ts      # SEO sitemap配置
│   ├── manifest.ts     # Web App清单
│   └── page.tsx        # 首页
├── components/         # React组件
│   ├── ChatInterface.tsx
│   └── VoiceChat.tsx
├── lib/               # 工具函数
│   ├── seo-config.ts  # SEO全局配置
│   ├── meta-tags.ts   # Meta标签生成
│   ├── schema-org.tsx # 结构化数据
│   └── api-keys.ts
└── i18n/              # 国际化
    ├── context.tsx
    ├── en.json
    └── zh.json
```

## 🌐 SEO 和品牌优化

本项目已实现完整的SEO优化和品牌标识系统:

### 📚 优化指南
- **[SEO-GUIDE.md](SEO-GUIDE.md)** - 详细的SEO实施指南
- **[SEO-CHECKLIST.md](SEO-CHECKLIST.md)** - SEO检查清单和部署指南
- **[BRAND-GUIDELINES.md](BRAND-GUIDELINES.md)** - 品牌标识和使用规范
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - 快速参考指南

### ✨ 已实施的优化
- ✅ Meta标签和Open Graph优化
- ✅ Schema.org结构化数据
- ✅ 自动Sitemap和Robots.txt生成
- ✅ 多语言hreflang支持
- ✅ 图像formatl优化 (WebP, AVIF)
- ✅ 安全HTTP头部配置
- ✅ Web App清单 (PWA支持)

### 🎨 品牌资产
- [Logo (with text)](public/logo-with-text.svg) - 完整品牌Logo
- [Icon Logo](public/icon-logo.svg) - 品牌图标/Favicon
- [OG Image](public/og-image.svg) - 社交分享预览 (1200x630)
- 配色方案: 品牌蓝 (#0066FF) + 温暖橙 (#FFA24C)

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/)
- **UI库**: [HeroUI](https://heroui.com/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **语音**: [Riva Speech Services](https://github.com/nvidia-riva)
- **AI**: [OpenAI API](https://openai.com/api/)
- **音频**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## 🔌 API 集成

### 环境变量配置

创建 `.env.local` 文件:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Riva Speech Services
RIVA_ASR_SERVICE=grpc://localhost:50051
RIVA_TTS_SERVICE=grpc://localhost:50051

# 应用配置
NEXT_PUBLIC_APP_URL=https://negaapp.com
NEXT_PUBLIC_API_URL=https://api.negaapp.com
```

### API 端点

- `POST /api/chat` - 聊天接口
- `POST /api/transcribe` - 语音转文字
- `POST /api/tts` - 文字转语音

## 📊 性能指标

目标 Core Web Vitals:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

## 🌍 国际化 (i18n)

支持语言:
- 🇺🇸 英文 (English)
- 🇨🇳 中文简体 (Simplified Chinese)

配置位置: `src/i18n/`

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤:

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 🌐 **网站**: [negaapp.com](https://negaapp.com)
- 📧 **邮件**: support@negaapp.com
- 🐦 **Twitter**: [@negaapp](https://twitter.com/negaapp)
- 💼 **LinkedIn**: [NEGA](https://linkedin.com/company/negaapp)
- 🐙 **GitHub**: [github.com/negaapp](https://github.com/negaapp)

## 🙏 致谢

感谢所有为NEGA项目做出贡献的人！

---

<div align="center">
  Made with ❤️ for English learners worldwide
  
  **NEGA** - Your Native English Grammar Assistant  
  你的西海岸纯正口语教练
</div>
