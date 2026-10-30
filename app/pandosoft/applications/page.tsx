"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import { WALLET_STATUS_LABELS, VIDEO_KYC_STATUS_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";

export default function PandosoftApplicationsPage() {
  const { summaries } = useOnboarding();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pandosoft Compliance Final Review Queue</h1>
        <p className="text-muted-foreground">
          Applications forwarded by the Pixelonics team for final review and either approval or rejection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Final Review Queue ({summaries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Wallet Status</TableHead>
                <TableHead>Video KYC</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((app) => {
                const isForwarded =
                  app.status === "ready_for_compliance" ||
                  Boolean(app.forwardedToPandosoftAt) ||
                  app.status === "approved" ||
                  app.status === "rejected";

                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.reference}</TableCell>
                    <TableCell>{app.businessName}</TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isForwarded
                            ? "border-emerald-500 text-emerald-600 bg-emerald-500/5 text-xs"
                            : "border-amber-400 text-amber-600 bg-amber-500/5 text-xs"
                        }
                      >
                        {isForwarded ? "Verified by Pixelonics" : "In Pixelonics Verification"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.documentProgress.verified}/{app.documentProgress.uploaded}
                    </TableCell>
                    <TableCell>{WALLET_STATUS_LABELS[app.walletStatus]}</TableCell>
                    <TableCell>{VIDEO_KYC_STATUS_LABELS[app.videoKycStatus]}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={isForwarded ? "default" : "outline"} asChild>
                        <Link href={`/pandosoft/applications/${app.id}`}>
                          {isForwarded ? "Final Review" : "Inspect"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
