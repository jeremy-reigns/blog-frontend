import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blog Generation App",
  description: "Generate deeply researched technical blogs automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Add suppressHydrationWarning here to ignore extension-injected attributes
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}