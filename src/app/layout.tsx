import type { ReactNode } from "react";

import "./globals.css";
import "../landing/landing.css";
import { GlobalCursor } from "@/components/shared/GlobalCursor";

export const metadata = {
  title: "NEXUS - Autonomous M&A Intelligence",
  description:
    "NEXUS monitors public web signals and surfaces M&A intelligence before announcements drop.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Patrick+Hand+SC&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GlobalCursor />
        {children}
      </body>
    </html>
  );
}
