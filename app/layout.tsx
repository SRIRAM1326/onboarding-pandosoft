import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { OnboardingProvider } from "@/lib/store/onboarding-store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixelonics Client Onboarding Portal",
  description: "Corporate KYC and onboarding portal for Pixelonics × Pandosoft India Private Limited",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <OnboardingProvider>
          {children}
          <Toaster richColors position="top-right" />
        </OnboardingProvider>
      </body>
    </html>
  );
}
