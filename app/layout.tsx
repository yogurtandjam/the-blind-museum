import type { Metadata } from "next";
import Script from "next/script";
import "../src/index.css";

export const metadata: Metadata = {
  title: "The Blind Museum",
  description: "A museum you experience with your eyes closed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8ZCGCGM275"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8ZCGCGM275');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
