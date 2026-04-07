import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { themePrepaintScript } from "@/lib/theme-init";

import "./globals.css";

export const metadata: Metadata = {
  title: "CollabSphere",
  description:
    "Next.js App Router foundation for the CollabSphere product frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
      <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-prepaint-init" strategy="beforeInteractive">
          {themePrepaintScript}
        </Script>
      </head>
      <body className="app-shell-root">
        <ThemeProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

