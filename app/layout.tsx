import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CurtainCall",
  description: "Track every play you've ever seen",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
