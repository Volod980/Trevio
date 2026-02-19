import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trevio — Photo & Video Production Studio",
  description: "Professional photo and video production order management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
