import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GameGen — Vercel AI Primitives Demo",
  description: "Mini Game Generator powered by Vercel Workflows, AI Gateway, Sandbox, and Compute",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
