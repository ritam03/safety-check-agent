import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Safety Check Agent",
  description:
    "A deterministic safety and conflict-check agent that validates user profiles against medically-grounded rules before workout session generation.",
  keywords: ["safety check", "exercise screening", "PAR-Q", "fitness validation", "health check"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
