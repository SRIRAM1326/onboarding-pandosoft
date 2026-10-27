import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[rgba(249,249,249,0.8)] backdrop-blur-2xl backdrop-saturate-180 dark:bg-[rgba(28,28,30,0.8)]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-[0_2px_8px_rgba(0,122,255,0.4)]">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">Pixelonics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ios-plain" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="ios" size="sm" asChild>
              <Link href="/portal">Get Started</Link>
            </Button>
            <Button variant="ios-gray" size="sm" asChild>
              <Link href="/admin">Admin Portal</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center rounded-full bg-[rgba(118,118,128,0.12)] px-4 py-1.5 text-sm font-medium text-foreground backdrop-blur-xl dark:bg-[rgba(118,118,128,0.24)]">
              Enterprise KYC Platform
            </div>
            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Corporate Client Onboarding, Simplified.
            </h1>
            <p className="mx-auto mb-10 max-w-[780px] text-lg leading-8 text-muted-foreground sm:text-xl">
              Streamline business KYC, beneficial ownership verification, source of funds assessment, and crypto wallet verification through a structured, compliant onboarding process.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="ios" asChild>
                <Link href="/portal">Start Onboarding</Link>
              </Button>
              <Button size="lg" variant="ios-gray" asChild>
                <Link href="/admin">View Compliance Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Structured KYC process</h2>
            <p className="mx-auto max-w-[780px] text-lg text-muted-foreground">
              A guided application for corporate clients. Clear steps ensure all director, shareholder, and entity credentials are right the first time.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="ios-card overflow-hidden">
              <CardContent className="p-7">
                <div className="mb-4 text-sm font-semibold tracking-widest text-primary">01. SYSTEMATIC VERIFICATION</div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Document submission and tracking</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep your documents and application status organized. Upload securely once, monitor validation logs, and receive inline requests if anything requires updating.
                </p>
              </CardContent>
            </Card>

            <Card className="ios-card overflow-hidden">
              <CardContent className="p-7">
                <div className="mb-4 text-sm font-semibold tracking-widest text-primary">02. ZERO LOST ATTACHMENTS</div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Wallet verification workflow</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Submit wallet details for compliance review. Simple cryptographic proof-of-ownership satisfies regulatory guidelines before corporate trading commences.
                </p>
              </CardContent>
            </Card>

            <Card className="ios-card overflow-hidden md:col-span-2 lg:col-span-1">
              <CardContent className="p-7">
                <div className="mb-4 text-sm font-semibold tracking-widest text-primary">03. TRAVEL-RULE COMPLIANT</div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Built-in compliance checks</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Streamlined screening and structured data capture designed to align with evolving travel-rule obligations and corporate KYC requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-[rgba(249,249,249,0.8)] backdrop-blur-2xl backdrop-saturate-180 dark:bg-[rgba(28,28,30,0.8)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Pixelonics. All rights reserved. Demo environment.
          </p>
        </div>
      </footer>
    </div>
  );
}

