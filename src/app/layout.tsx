import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lodge Booking & Billing SaaS",
  description: "Multi-tenant lodge booking, occupancy tracking, and guest billing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-stone-50 text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
