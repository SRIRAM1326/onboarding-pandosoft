import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Pixelonics</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/portal">Get Started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Admin Portal</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
              Enterprise KYC Platform
            </div>
            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Corporate Client Onboarding, Simplified.
            </h1>
            <p className="mx-auto mb-10 max-w-[780px] text-lg leading-8 text-muted-foreground sm:text-xl">
              Streamline business KYC, beneficial ownership verification, source of funds assessment, and crypto wallet verification through a structured, compliant onboarding process.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/portal">Start Onboarding</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin">View Compliance Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-xl font-semibold text-foreground">Compliance-First Design</h3>
                <p className="mb-3 text-sm font-medium text-foreground/80">Built for regulatory requirements</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  A structured seven-step onboarding workflow for business information, ownership, financial evidence, declarations, and verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-xl font-semibold text-foreground">Dual Portal Experience</h3>
                <p className="mb-3 text-sm font-medium text-foreground/80">Dedicated customer and admin workflows</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Customers submit and track applications while compliance teams review documents, request corrections, and manage approvals.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm md:col-span-2 lg:col-span-1">
              <CardContent className="p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-1 text-xl font-semibold text-foreground">Integration-Ready</h3>
                <p className="mb-3 text-sm font-medium text-foreground/80">Designed for future backend integration</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  A modular frontend architecture prepared for FastAPI, PostgreSQL, and secure document storage. Demo data only.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Pixelonics. All rights reserved. Demo environment.
          </p>
        </div>
      </footer>
    </div>
  );
}

