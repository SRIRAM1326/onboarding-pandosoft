"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { PlusCircle } from "lucide-react";

export default function ApplicationsListPage() {
  const { summaries } = useOnboarding();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">View and manage your onboarding applications</p>
        </div>
        <Button asChild>
          <Link href="/portal/applications/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Start New Application
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({summaries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.reference}</TableCell>
                  <TableCell>{app.businessName}</TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={app.status} />
                  </TableCell>
                  <TableCell>
                    {app.documentProgress.verified}/{app.documentProgress.uploaded} verified
                  </TableCell>
                  <TableCell>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{app.progressPercent}%</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}`}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/1`}>Edit Wizard</Link>
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
