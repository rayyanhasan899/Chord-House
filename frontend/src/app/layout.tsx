import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
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
      <body>
        <noscript>
          <p>
            JavaScript is required for account forms. Enable it to sign in
            securely.
          </p>
        </noscript>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
