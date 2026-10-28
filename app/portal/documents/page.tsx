"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENT_STATUS_LABELS, SECTION_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import type { ApplicationDocument } from "@/lib/types";
import { FileText, Upload, Eye, X } from "lucide-react";

export default function DocumentsPage() {
  const { applications } = useOnboarding();
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);
  const allDocs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appReference: app.reference }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and track all uploaded KYC documents</p>
        </div>
        <Button asChild>
          <Link href={`/portal/applications/${applications[0]?.id ?? "app-demo-001"}/step/1`}>
            <Upload className="mr-2 h-4 w-4" />
            Upload / Replace Documents
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Library ({allDocs.length})</CardTitle>
          <CardDescription>All supporting documents across your applications</CardDescription>
        </CardHeader>
        <CardContent>
          {allDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Documents uploaded during onboarding will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {doc.previewUrl && doc.mimeType?.startsWith("image/") ? (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="h-10 w-10 overflow-hidden rounded border bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.previewUrl}
                            alt={doc.fileName}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{doc.appReference}</TableCell>
                    <TableCell>{doc.label}</TableCell>
                    <TableCell>{SECTION_LABELS[doc.section]}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.fileName}</TableCell>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      {doc.previewUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {doc.reviewerNotes || "-"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewDoc && previewDoc.previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-xl border bg-background p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4 border-b pb-2">
              <div>
                <p className="font-semibold">{previewDoc.label}</p>
                <p className="text-xs text-muted-foreground">{previewDoc.fileName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                <X className="mr-1 h-4 w-4" />
                Close
              </Button>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDoc.previewUrl}
                alt={previewDoc.fileName}
                className="max-h-[75vh] w-auto rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
