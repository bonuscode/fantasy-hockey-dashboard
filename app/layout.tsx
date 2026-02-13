import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import NetworkStatus from "./components/NetworkStatus";
import QueryProvider from "./components/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Brew Zoo Dashboard",
  description:
    "Analytics dashboard for Yahoo Fantasy NHL league - standings, stats, and matchups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <NetworkStatus />
          <Navigation />
          <main className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
