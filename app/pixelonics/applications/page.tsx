"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";

export default function PixelonicsApplicationsListPage() {
  const { summaries } = useOnboarding();
  const [search, setSearch] = useState("");

  const filtered = summaries.filter(
    (a) =>
      a.reference.toLowerCase().includes(search.toLowerCase()) ||
      a.businessName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Applications</h1>
          <p className="text-muted-foreground">Pixelonics Operations application queue</p>
        </div>
        <Button asChild>
          <Link href="/pixelonics/create-on-behalf">Create on Behalf of Customer</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search by reference or business name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Open Corrections</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.reference}</TableCell>
                  <TableCell>{app.businessName}</TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    {app.documentProgress.verified}/{app.documentProgress.uploaded}
                  </TableCell>
                  <TableCell>{app.openCorrections}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/pixelonics/applications/${app.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
