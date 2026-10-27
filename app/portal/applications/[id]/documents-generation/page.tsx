import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileText } from "lucide-react";

const docs = [
  "Board Resolution / Authorization Letter",
  "Customer Undertaking for Lien Resolution",
  "Client Onboarding Form (Complete all pages)",
  "OTC AML Agreement",
  "Source of Funds Declaration",
  "UBO (Ultimate Beneficial Owner) Declaration Form",
  "Wallet Declaration Form",
];

export default function DocumentsGenerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document Generation & Signed Upload</h1>
        <p className="text-muted-foreground">Generate required documents from submitted data, sign & stamp, upload signed copies</p>
      </div>

      <div className="rounded-lg bg-warning-soft p-4 text-sm text-warning">
        <p className="font-medium">Important</p>
        <p>All declarations, undertakings, and authorization documents must be submitted on the client's official letterhead, duly signed and stamped by the authorized signatory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>7 Required Onboarding Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {docs.map((doc, idx) => (
              <div key={doc} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{idx + 1}. {doc}</p>
                    <p className="text-sm text-muted-foreground">Status: Not Generated</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Generate .DOCX
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Generate .PDF
                  </Button>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Signed & Stamped
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
