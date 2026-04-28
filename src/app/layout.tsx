import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "knowwhatiwant",
  description:
    "Säg vad du vill bo i — gata, hus eller helt brett — så hittar mäklare leads som faktiskt matchar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-fg">{children}</body>
    </html>
  );
}
