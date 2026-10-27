import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockApplicationSummaries } from "@/lib/mock-data/applications";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">Search and filter all applications</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input placeholder="Search by reference or business name..." className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Assigned Reviewer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApplicationSummaries.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.reference}</TableCell>
                  <TableCell>{app.businessName}</TableCell>
                  <TableCell>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{app.assignedReviewerName}</TableCell>
                  <TableCell>Under Review</TableCell>
                  <TableCell>
                    {app.documentProgress.verified}/{app.documentProgress.uploaded}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/applications/${app.id}`}>Review</Link>
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
