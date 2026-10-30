"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsEmail, loginByRole } = useOnboarding();
  const [email, setEmail] = useState("arjun.mehta@orbitrade.example");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      const user = await loginAsEmail(email, password);
      toast.success(`Signed in as ${user.name}`);
      if (user.role === "pixelonics_ops" || user.role === "pixelonics_admin") {
        router.push("/pixelonics");
      } else if (user.role === "pandosoft_reviewer" || user.role === "pandosoft_approver") {
        router.push("/pandosoft");
      } else if (user.role === "customer") {
        router.push("/portal");
      } else {
        router.push("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = (role: "customer" | "pixelonics_ops" | "pandosoft_reviewer" | "administrator", path: string) => {
    const user = loginByRole(role);
    toast.success(`Logged in as ${user.name} (${user.title})`);
    router.push(path);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="lg" align="center" />
          </div>
          <CardTitle className="text-2xl">Sign in to Pixelonics</CardTitle>
          <CardDescription>Pixelonics × Pandosoft India Private Limited</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <Separator />

          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">Instant Role Access</p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleQuickRole("customer", "/portal")}
            >
              Login as Customer (Orbitrade Solutions)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleQuickRole("pixelonics_ops", "/pixelonics")}
            >
              Login as Pixelonics Team (Operations)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleQuickRole("pandosoft_reviewer", "/pandosoft")}
            >
              Login as Pandosoft Team (Compliance)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleQuickRole("administrator", "/admin")}
            >
              Login as Head of Compliance (Admin)
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
