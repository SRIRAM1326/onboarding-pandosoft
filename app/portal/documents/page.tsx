"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENT_STATUS_LABELS, SECTION_LABELS } from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { DocumentViewerModal } from "@/components/documents/document-viewer-modal";
import { isPdfFile, isImageFile } from "@/lib/utils/document-previews";
import type { ApplicationDocument } from "@/lib/types";
import { FileText, Upload, Eye } from "lucide-react";

export default function DocumentsPage() {
  const { applications } = useOnboarding();
  const [selectedDoc, setSelectedDoc] = useState<(ApplicationDocument & { appReference: string }) | null>(null);

  const allDocs = applications.flatMap((app) =>
    app.documents.map((d) => ({ ...d, appReference: app.reference }))
  );

  const targetApp = selectedDoc
    ? applications.find((a) => a.id === selectedDoc.applicationId)
    : undefined;

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
                {allDocs.map((doc) => {
                  const isPdf = isPdfFile(doc.fileName, doc.mimeType);
                  const isImage = isImageFile(doc.fileName, doc.mimeType);

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="h-10 w-10 flex items-center justify-center overflow-hidden rounded border bg-muted hover:border-primary transition-colors"
                        >
                          {isPdf ? (
                            <span className="text-[10px] font-bold text-rose-600">PDF</span>
                          ) : isImage && doc.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={doc.previewUrl}
                              alt={doc.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        application={targetApp}
        allDocuments={allDocs}
        onSelectDocument={(doc) => {
          const appDoc = doc as ApplicationDocument & { appReference: string };
          setSelectedDoc(appDoc);
        }}
        isOfficer={false}
      />
    </div>
  );
}
