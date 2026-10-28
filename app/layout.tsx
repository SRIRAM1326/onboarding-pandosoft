import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { OnboardingProvider } from "@/lib/store/onboarding-store";

export const metadata: Metadata = {
  title: "Pixelonics Client Onboarding Portal",
  description: "Corporate KYC and onboarding portal for Pixelonics × Pandosoft India Private Limited",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var k = 'pixelonics_onboarding_state_v1';
                var raw = localStorage.getItem(k);
                if (raw && (raw.length > 50000 || raw.indexOf('data:video') !== -1 || raw.indexOf('data:image') !== -1)) {
                  localStorage.removeItem(k);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <OnboardingProvider>
          {children}
          <Toaster richColors position="top-right" />
        </OnboardingProvider>
      </body>
    </html>
  );
}
