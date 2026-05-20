import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterSW from "../components/RegisterSW";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dental Med Agendamento",
  description: "Portal de Agendamento Dental Med",
  manifest: "/manifest.json",
  themeColor: "#0f62fe",
  appleWebApp: {
    capable: true,
    title: "Dental Med",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f62fe" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>

     <body className="min-h-full flex flex-col">
  {children}
  <RegisterSW />
</body>
    </html>
  );
}