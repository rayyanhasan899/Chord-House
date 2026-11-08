import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Chord House",
  description: "Your home for guitar learning",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
