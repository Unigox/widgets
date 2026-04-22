import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const parkinsans = localFont({
  variable: "--font-parkinsans",
  src: [
    { path: "../../public/fonts/Parkinsans-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Parkinsans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Parkinsans-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Parkinsans-Regular.ttf", weight: "400", style: "normal" },
  ],
});

const title = "Unigox Widgets";
const description =
  "Integration playground for the Unigox embeddable buy/sell widget.";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: [
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: { url: "/favicon/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "Unigox",
  },
  openGraph: {
    type: "website",
    siteName: "Unigox",
    title,
    description,
    images: [{ url: "/opengraph-image.png", width: 762, height: 400 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [{ url: "/opengraph-image.png", width: 762, height: 400 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${parkinsans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-design-blue-400 font-sans">{children}</body>
    </html>
  );
}
