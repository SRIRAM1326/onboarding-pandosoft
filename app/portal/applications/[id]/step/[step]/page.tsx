import { WizardProgress } from "@/components/onboarding/wizard-progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUploader } from "@/components/documents/document-uploader";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

export default async function WizardStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id, step } = await params;
  const stepNum = parseInt(step);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding Application</h1>
          <p className="text-muted-foreground">PX-DEMO-001</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portal/applications/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Application
          </Link>
        </Button>
      </div>

      <WizardProgress currentStep={stepNum} />

      <Card>
        <CardHeader>
          <CardTitle>
            {stepNum === 1 && "Step 1: Business Information"}
            {stepNum === 2 && "Step 2: Authorized Signatory"}
            {stepNum === 3 && "Step 3: Beneficial Ownership (UBO)"}
            {stepNum === 4 && "Step 4: Financial Information & Source of Funds"}
            {stepNum === 5 && "Step 5: Crypto Wallet Verification"}
            {stepNum === 6 && "Step 6: Declarations & Video KYC"}
            {stepNum === 7 && "Step 7: Review & Submit"}
          </CardTitle>
          <CardDescription>
            {stepNum === 1 && "Provide your business details and registration information"}
            {stepNum === 2 && "Details of the authorized signatory"}
            {stepNum === 3 && "Add beneficial owners with ≥25% ownership"}
            {stepNum === 4 && "Bank details and source of funds information"}
            {stepNum === 5 && "Add and verify crypto wallets"}
            {stepNum === 6 && "Complete declarations and schedule Video KYC"}
            {stepNum === 7 && "Review all information before submission"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stepNum === 1 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Business Name *</Label>
                  <Input id="legalName" defaultValue="Orbitrade Solutions Pvt. Ltd." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityType">Business Entity Type *</Label>
                  <Select defaultValue="private_limited">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private_limited">Private Limited</SelectItem>
                      <SelectItem value="public_limited">Public Limited</SelectItem>
                      <SelectItem value="llp">LLP</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="proprietorship">Proprietorship</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN *</Label>
                  <Input id="pan" defaultValue="AABCO1234F" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cin">CIN / Registration Number *</Label>
                  <Input id="cin" defaultValue="U74999MH2020PTC123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (if applicable)</Label>
                  <Input id="gstin" defaultValue="27AABCO1234F1Z5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input id="email" type="email" defaultValue="compliance@orbitrade.example" />
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium">Required Documents</p>
                <div className="space-y-3">
                  <DocumentUploader label="Business PAN Card" description="Clear copy of entity's PAN card" />
                  <DocumentUploader label="Certificate of Incorporation" description="Issued by MCA / Registrar" />
                  <DocumentUploader label="GST Certificate" description="GST registration certificate (Form REG-06)" />
                </div>
              </div>
            </>
          )}

          {stepNum === 2 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signName">Full Name *</Label>
                  <Input id="signName" defaultValue="Arjun Mehta" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input id="designation" defaultValue="Managing Director" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signEmail">Email *</Label>
                  <Input id="signEmail" type="email" defaultValue="arjun.mehta@orbitrade.example" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input id="mobile" defaultValue="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signPan">PAN *</Label>
                  <Input id="signPan" defaultValue="ABCDE1234F" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input id="dob" type="date" defaultValue="1985-06-12" />
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium">Required Documents</p>
                <div className="space-y-3">
                  <DocumentUploader label="Signatory PAN Card" />
                  <DocumentUploader label="Identity Proof (Aadhaar / Passport / Driving License)" />
                  <DocumentUploader label="Passport-size Photograph" />
                  <DocumentUploader label="Board Resolution / Authorization Letter" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="auth" defaultChecked />
                <Label htmlFor="auth" className="text-sm">
                  I confirm that the authorization document is signed and stamped where required
                </Label>
              </div>
            </>
          )}

          {stepNum === 3 && (
            <>
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Beneficial Owner 1</p>
                    <p className="text-sm text-muted-foreground">Arjun Mehta - 65% ownership</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Beneficial Owner 2</p>
                    <p className="text-sm text-muted-foreground">Priya Nair - 35% ownership</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
              <Button variant="outline">+ Add Beneficial Owner</Button>
              <p className="text-sm text-muted-foreground">
                Total ownership: 100%. UBO threshold: 25% (as per Pixelonics policy). Both owners declared.
              </p>
            </>
          )}

          {stepNum === 4 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input id="bankName" defaultValue="HDFC Bank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accHolder">Account Holder Name *</Label>
                  <Input id="accHolder" defaultValue="Orbitrade Solutions Pvt. Ltd." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accNo">Account Number *</Label>
                  <Input id="accNo" defaultValue="50100XXXXXX1234" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC *</Label>
                  <Input id="ifsc" defaultValue="HDFC0001234" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceFunds">Source of Funds Category *</Label>
                <Select defaultValue="business_revenue">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business_revenue">Business operating revenue</SelectItem>
                    <SelectItem value="retained_earnings">Retained earnings</SelectItem>
                    <SelectItem value="equity_capital">Equity capital</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Privacy Notice</p>
                <p className="text-muted-foreground">Sensitive financial information is handled with care. In demo mode, this data is not sent to any backend.</p>
              </div>

              <div>
                <p className="mb-3 font-medium">Required Documents</p>
                <div className="space-y-3">
                  <DocumentUploader label="Cancelled Cheque" />
                  <DocumentUploader label="Bank Statements (last 6 months)" />
                  <DocumentUploader label="Business Income Proof" />
                  <DocumentUploader label="Financial Statements" />
                </div>
              </div>
            </>
          )}

          {stepNum === 5 && (
            <>
              <div className="rounded-lg border p-4">
                <div className="mb-3">
                  <p className="font-medium">Wallet 1</p>
                  <p className="text-sm text-muted-foreground">Trading Hot Wallet - Ethereum</p>
                  <p className="font-mono text-xs mt-1">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs text-warning">Pending (Demo)</span>
                </div>
              </div>
              <Button variant="outline">+ Add Wallet</Button>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Important</p>
                <p className="text-muted-foreground">Never request seed phrases or private keys. All verification is marked as simulated in demo mode.</p>
              </div>
            </>
          )}

          {stepNum === 6 && (
            <>
              <div>
                <p className="mb-3 font-medium">Declarations</p>
                <div className="space-y-3">
                  {["Board Resolution / Authorization Letter", "Customer Undertaking for Lien Resolution", "Client Onboarding Form", "OTC AML Agreement", "Source of Funds Declaration", "UBO Declaration", "Wallet Declaration"].map((decl) => (
                    <div key={decl} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id={decl} defaultChecked />
                        <Label htmlFor={decl} className="text-sm">{decl}</Label>
                      </div>
                      <Button variant="ghost" size="sm">View / Download Template</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium">Video KYC</p>
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Status: Not Scheduled</p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <Button variant="outline" size="sm">Oct 28 10:00 AM - Ananya Roy</Button>
                    <Button variant="outline" size="sm">Oct 28 2:00 PM - Rahul Desai</Button>
                    <Button variant="outline" size="sm">Oct 29 11:00 AM - Ananya Roy</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Select an available slot to schedule (Demo only)</p>
                </div>
              </div>
            </>
          )}

          {stepNum === 7 && (
            <>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Business Information</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/1`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Orbitrade Solutions Pvt. Ltd. • Private Limited • PAN: AABCO1234F</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Authorized Signatory</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/2`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Arjun Mehta • Managing Director</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Beneficial Owners</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/3`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">2 owners • Total 100% declared</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Financial Information</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/4`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">HDFC Bank • Business Revenue</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Wallets</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/5`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">1 wallet • Pending verification (Demo)</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">Declarations & Video KYC</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${id}/step/6`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">All 7 declarations acknowledged • Video KYC not scheduled</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="confirm" />
                <Label htmlFor="confirm" className="text-sm">
                  I confirm that all information provided is true and accurate. This is a frontend demonstration submission.
                </Label>
              </div>

              <div className="rounded-lg bg-warning-soft p-3 text-sm text-warning">
                <p className="font-medium">Demo Submission</p>
                <p>This submission is for frontend demonstration only and has not been submitted to Pixelonics' actual systems.</p>
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex gap-2">
              {stepNum > 1 && (
                <Button variant="outline" asChild>
                  <Link href={`/portal/applications/${id}/step/${stepNum - 1}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Link>
                </Button>
              )}
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
            {stepNum < 7 ? (
              <Button asChild>
                <Link href={`/portal/applications/${id}/step/${stepNum + 1}`}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/portal">Submit Application (Demo) - PX-DEMO-001</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
