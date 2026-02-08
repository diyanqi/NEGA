// SEO Configuration for NEGA
export const seoConfig = {
  siteName: "NEGA",
  title: "NEGA - Your Native English Grammar Assistant",
  titleTemplate: "%s | NEGA",
  description: "AI-powered English grammar assistant and native speaker oral coach. Learn English naturally with real-time feedback and pronunciation guidance.",
  descriptionZh: "你的西海岸纯正口语教练 - NEGA是您的AI英文语法助手。提供实时语法纠正、发音指导和口语提升。",
  
  slogans: {
    en: "Your Native English Grammar Assistant",
    zh: "你的西海岸纯正口语教练",
  },
  
  keywords: {
    en: [
      "English Grammar",
      "Grammar Assistant",
      "English Coach",
      "Natural Language Learning",
      "Pronunciation Guide",
      "AI English Teacher",
      "Speaking Practice",
      "Oral English",
    ],
    zh: [
      "英文语法",
      "语法纠正",
      "口语教练",
      "英语学习",
      "发音指导",
      "AI英文助手",
      "英文口语",
      "西海岸英文",
    ],
  },

  urls: {
    base: "https://negaapp.com",
    en: "https://negaapp.com/en",
    zh: "https://negaapp.com/zh",
  },

  socialLinks: {
    twitter: "https://twitter.com/negaapp",
    linkedin: "https://linkedin.com/company/negaapp",
    github: "https://github.com/negaapp",
  },

  structuredData: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NEGA",
    "description": "AI-powered English Grammar Assistant and Oral Coach",
    "applicationCategory": "EducationalApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000",
    },
  },

  ogImage: {
    url: "https://negaapp.com/og-image.png",
    width: 1200,
    height: 630,
    alt: "NEGA - English Grammar Assistant",
  },
};

export default seoConfig;
