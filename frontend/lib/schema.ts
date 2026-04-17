import { faqItems, services } from "@/data/site-content";
import { siteConfig } from "@/lib/site";

export function getHomeJsonLd() {
  const organizationId = `${siteConfig.url}#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: siteConfig.url,
        telephone: siteConfig.phoneDisplay,
        description: siteConfig.description,
        areaServed: "United Kingdom",
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: siteConfig.phoneDisplay,
            contactType: "customer service",
            availableLanguage: ["English", "Spanish"],
            areaServed: "GB",
          },
        ],
      },
      {
        "@type": "Service",
        "@id": `${siteConfig.url}#services`,
        name: "Same Day Courier & Logistics Services",
        provider: {
          "@id": organizationId,
        },
        areaServed: "United Kingdom",
        serviceType: "Dedicated same day courier and business logistics",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Transport Services",
          itemListElement: services.map((service) => ({
            "@type": "OfferCatalog",
            name: service.title,
            itemListElement: [
              {
                "@type": "Service",
                name: service.title,
                description: service.description,
              },
            ],
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}#faq`,
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}
