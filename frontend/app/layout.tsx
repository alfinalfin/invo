import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { siteConfig } from "@/lib/site";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Invoaura CRM | Logistics Lead Operations",
    template: "%s | Invoaura CRM",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Invoaura CRM",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoaura CRM",
    description: siteConfig.description,
  },
};

const themeInitializer = `
  try {
    const stored = localStorage.getItem("invoaura-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (preferredDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        {children}
      </body>
    </html>
  );
}
