"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { downloadDeclarationDocument } from "@/lib/utils/document-generator";
import type { DeclarationKey } from "@/lib/types";
import { ArrowLeft, Download, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsGenerationPage() {
  const { id } = useParams<{ id: string }>();
  const { getApplication, uploadDocument, updateApplication } = useOnboarding();
  const app = getApplication(id);

  const handleDownload = async (key: DeclarationKey, name: string, format: "pdf" | "docx") => {
    await downloadDeclarationDocument(app, key, format);
    toast.success(`Generated & downloaded ${name} (${format.toUpperCase()})`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Auto-Generated Corporate Declarations ({app.reference})
          </h1>
          <p className="text-muted-foreground">
            Pre-populated with {app.business.legalName || "your company"} details. Download, sign &amp; stamp on company letterhead, then upload the executed copy.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portal/applications/${app.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Application
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {app.declarations.map((decl) => {
          const uploadedSignedDoc = app.documents.find(
            (d) => d.requirementKey === `signed_${decl.key}`
          );
          return (
            <Card key={decl.key}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      {decl.name}
                    </CardTitle>
                    <CardDescription>{decl.description}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {decl.requiresSignature && <Badge variant="outline">Signature Required</Badge>}
                    {decl.requiresStamp && <Badge variant="outline">Company Stamp Required</Badge>}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(decl.key, decl.name, "pdf")}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(decl.key, decl.name, "docx")}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download DOCX
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentUploader
                  label={`Upload Signed & Stamped ${decl.name}`}
                  description="Upload the executed scan (PDF/JPEG/PNG) after signing and stamping"
                  required={true}
                  existingDocument={uploadedSignedDoc}
                  onUpload={(file) => {
                    uploadDocument(app.id, file, {
                      requirementKey: `signed_${decl.key}`,
                      section: "declarations",
                      label: `Signed ${decl.name}`,
                    });
                    updateApplication(app.id, (cur) => ({
                      ...cur,
                      declarations: cur.declarations.map((d) =>
                        d.key === decl.key
                          ? { ...d, acknowledged: true, acknowledgedAt: new Date().toISOString() }
                          : d
                      ),
                    }));
                  }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
