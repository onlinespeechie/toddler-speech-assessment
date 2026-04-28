import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Online Speechie Assessment",
  description: "Late Talker Speech Assessment Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
