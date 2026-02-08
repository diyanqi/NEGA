import { ReactNode } from "react";

interface SchemaOrgJsonLd {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

interface JsonLdProps {
  data: SchemaOrgJsonLd;
  children?: ReactNode;
}

export function JsonLD({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// Organization Schema
export const organizationSchema: SchemaOrgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://negaapp.com/#organization",
  name: "NEGA",
  url: "https://negaapp.com",
  logo: {
    "@type": "ImageObject",
    url: "https://negaapp.com/logo-with-text.svg",
    width: 240,
    height: 80,
  },
  description:
    "Your Native English Grammar Assistant - AI-powered oral coach for learning English naturally",
  sameAs: [
    "https://twitter.com/negaapp",
    "https://linkedin.com/company/negaapp",
    "https://github.com/negaapp",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@negaapp.com",
    url: "https://negaapp.com",
  },
};

// Web Application Schema
export const webApplicationSchema: SchemaOrgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://negaapp.com/#app",
  name: "NEGA",
  description:
    "AI-powered English Grammar Assistant and Native Speaker Oral Coach",
  url: "https://negaapp.com",
  applicationCategory: "EducationalApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1200",
    bestRating: "5",
    worstRating: "1",
  },
  features: [
    "Real-time grammar correction",
    "Pronunciation guidance",
    "Voice conversation practice",
    "Bilingual support (English/Chinese)",
    "AI-powered feedback",
  ],
  operatingSystem: ["Web", "iOS", "Android"],
  inLanguage: ["en", "zh"],
  author: {
    "@type": "Organization",
    name: "NEGA Team",
  },
};

// Breadcrumb Schema
export const breadcrumbSchema: SchemaOrgJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://negaapp.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "English Learning",
      item: "https://negaapp.com/learn",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Grammar Assistant",
      item: "https://negaapp.com/grammar",
    },
  ],
};
