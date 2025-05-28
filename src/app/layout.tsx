import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Daniel Bonnin - Personal Portfolio",
  description:
    "Innovative Software Engineer specializing in Full Stack Development and AI/ML solutions.",
  openGraph: {
    title: "Daniel Bonnin - Personal Portfolio",
    description:
      "Innovative Software Engineer specializing in Full Stack Development and AI/ML solutions.",
    type: "website",
    locale: "en_US",
    url: "https://danielsbonnin.com", // Replace with your actual domain
    siteName: "Daniel Bonnin",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="bg-light-bg text-dark-text flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
