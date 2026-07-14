import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biankiii | Personal Portfolio",
  description: "Personal portfolio website of Biankiii",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
