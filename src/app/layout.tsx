import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com"),
  title: {
    default: "سايتكم | حلول رقمية",
    template: "%s | سايتكم",
  },
  description: "سايتكم — حلول رقمية وتطوير مواقع ومتاجر وأنظمة إدارية في الأردن.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=location.pathname;var en=/^\\/(en)(?=\\/|$)/.test(l);document.documentElement.lang=en?"en":"ar";document.documentElement.dir=en?"ltr":"rtl";}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${tajawal.variable} font-sans`}>{children}</body>
    </html>
  );
}
