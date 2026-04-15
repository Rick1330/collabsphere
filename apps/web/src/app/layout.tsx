import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { themePrepaintScript } from "@/lib/theme-init";

import "./globals.css";

const sansFont = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CollabSphere",
  description:
    "CollabSphere brings documents, tasks, and collaboration into one focused workspace.",
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
      <body className={`${sansFont.variable} ${monoFont.variable} app-shell-root`}>
        <AppProviders>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

