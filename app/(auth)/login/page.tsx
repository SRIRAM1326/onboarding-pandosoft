import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Pixelonics</CardTitle>
          <CardDescription>Pixelonics × Pandosoft India Private Limited</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full" asChild>
            <Link href="/portal">Sign In (Demo)</Link>
          </Button>
          <Separator />
          <div className="space-y-2">
            <p className="text-center text-xs text-muted-foreground">Quick Demo Access</p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/portal">Login as Customer</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/pixelonics">Login as Pixelonics Team (Operations)</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/pandosoft">Login as Pandosoft Team (Compliance)</Link>
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
