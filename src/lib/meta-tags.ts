/**
 * SEO Meta Tags Helper
 * Generate optimized meta tags for different languages and pages
 */

interface MetaTagsConfig {
  title: string;
  description: string;
  keywords?: string[];
  slug?: string;
  image?: string;
  type?: "website" | "article" | "product";
  author?: string;
  locale?: "en-US" | "zh-CN";
}

export function generateMetaTags(config: MetaTagsConfig) {
  const {
    title,
    description,
    keywords = [],
    slug = "",
    image = "/og-image.png",
    type = "website",
    author = "NEGA",
    locale = "en-US",
  } = config;

  const baseUrl = "https://negaapp.com";
  const canonicalUrl = slug ? `${baseUrl}/${slug}` : baseUrl;

  return {
    title,
    description,
    keywords: keywords.join(", "),
    canonical: canonicalUrl,
    openGraph: {
      type,
      locale,
      url: canonicalUrl,
      title,
      description,
      image,
      siteName: "NEGA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

// Pre-configured meta tags for different pages/languages
export const pageMetaTags = {
  home: {
    en: generateMetaTags({
      title: "NEGA - Your Native English Grammar Assistant",
      description:
        "Master English grammar and pronunciation with AI-powered assistance. Real-time feedback, voice practice, and personalized coaching.",
      keywords: [
        "English Grammar",
        "Grammar Assistant",
        "English Learning",
        "Pronunciation Guide",
        "AI English Coach",
      ],
      slug: "",
      locale: "en-US",
    }),
    zh: generateMetaTags({
      title: "NEGA - 你的西海岸纯正口语教练",
      description:
        "你的AI英文语法助手和口语教练。提供实时语法纠正、发音指导、语音对话练习等功能。",
      keywords: [
        "英文语法",
        "口语教练",
        "英语学习",
        "发音指导",
        "AI英文助手",
      ],
      slug: "zh",
      locale: "zh-CN",
    }),
  },
  about: {
    en: generateMetaTags({
      title: "About NEGA - English Grammar Assistant",
      description: "Learn about NEGA, your AI-powered English grammar assistant and oral coach.",
      slug: "about",
      locale: "en-US",
    }),
    zh: generateMetaTags({
      title: "关于NEGA - 口语教练",
      description: "了解NEGA，您的AI英文语法助手和西海岸纯正口语教练。",
      slug: "about",
      locale: "zh-CN",
    }),
  },
  features: {
    en: generateMetaTags({
      title: "Features - NEGA English Grammar Assistant",
      description:
        "Discover NEGA features: real-time grammar correction, pronunciation guidance, voice practice, and more.",
      keywords: ["Grammar Checking", "Voice Practice", "Language Learning"],
      slug: "features",
      locale: "en-US",
    }),
    zh: generateMetaTags({
      title: "功能 - NEGA 口语教练",
      description: "探索NEGA功能：实时语法纠正、发音指导、语音练习等。",
      keywords: ["语法检查", "发音练习", "口语学习"],
      slug: "features",
      locale: "zh-CN",
    }),
  },
};
