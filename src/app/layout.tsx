import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { SocketProvider } from './providers';

import Navbar from "./Navbar";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traffic Monitoring",
  description: "Traffic Monitoring using Azure Event Hubs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full w-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-full min-h-screen`}
      >
        <SocketProvider>
         
          <header className="border-b border-gray-200 h-16 flex-shrink-0">
         <Navbar/>
          </header>

        
          <main className="flex-1 overflow-auto ">
            {children}
          </main>
        </SocketProvider>
      </body>
    </html>
  );
}
