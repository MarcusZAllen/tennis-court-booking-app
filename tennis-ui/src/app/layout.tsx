import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";


const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tennis Court Booking",
  description: "Find and book available tennis courts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jost.variable} font-jost antialiased bg-brand-background2`}>
        <div className="min-h-screen w-full flex flex-col items-center px-4">
          <Navbar />
          <main className="w-full max-w-[1440px] mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
