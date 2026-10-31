"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WizardProgress } from "@/components/onboarding/wizard-progress";
import { VideoKycRecorder } from "@/components/onboarding/video-kyc-recorder";
import { GeoSelfieRecorder } from "@/components/onboarding/geo-selfie-recorder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { getDocumentSlots, isSlotSatisfied } from "@/lib/config/document-requirements";
import {
  BANK_ACCOUNT_TYPE_LABELS,
  ENTITY_TYPE_LABELS,
  ID_DOCUMENT_LABELS,
  INDIAN_STATES,
  NETWORK_LABELS,
  SOURCE_OF_FUNDS_LABELS,
  TRANSACTION_FREQUENCIES,
  VIDEO_KYC_STATUS_LABELS,
  VOLUME_RANGES,
  WALLET_METHOD_LABELS,
  WALLET_STATUS_LABELS,
  WALLET_TYPE_LABELS,
} from "@/lib/constants/labels";
import { useOnboarding } from "@/lib/store/onboarding-store";
import { downloadDeclarationDocument } from "@/lib/utils/document-generator";
import type {
  BankAccount,
  BankAccountType,
  BeneficialOwner,
  BlockchainNetwork,
  DeclarationKey,
  Director,
  EntityType,
  IdentityDocumentType,
  SectionKey,
  SourceOfFundsCategory,
  Wallet,
  WalletType,
  WalletVerificationMethod,
} from "@/lib/types";
import { ArrowLeft, ArrowRight, Save, Plus, Trash2, Download, CheckCircle2, FileText, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

const STEP_SECTIONS: Record<number, SectionKey> = {
  1: "business",
  2: "signatory",
  3: "ubo",
  4: "financial",
  5: "wallets",
  6: "declarations",
  7: "review",
};

export default function WizardStepPage() {
  const { id, step } = useParams<{ id: string; step: string }>();
  const router = useRouter();
  const stepNum = Math.min(7, Math.max(1, parseInt(step) || 1));
  const sectionKey = STEP_SECTIONS[stepNum];

  const {
    getApplication,
    updateApplication,
    submitApplication,
    uploadDocument,
    uploadVideoKyc,
    saveDirectorSelfie,
    saveUboSelfie,
    addDirector,
    removeDirector,
    addBankAccount,
    removeBankAccount,
    setPrimaryBankAccount,
    policy,
    hydrated,
  } = useOnboarding();

  const app = getApplication(id);
  const [confirmSubmit, setConfirmSubmit] = useState(true);

  // New Director form state
  const [showAddDirector, setShowAddDirector] = useState(false);
  const [newDirector, setNewDirector] = useState({
    fullName: "",
    designation: "Director",
    identificationNumber: "",
    pan: "",
    email: "",
    mobile: "",
  });

  // New UBO form state
  const [showAddUbo, setShowAddUbo] = useState(false);
  const [newUbo, setNewUbo] = useState({
    fullName: "",
    ownershipPercentage: 25,
    role: "Director & Shareholder",
    pan: "",
    idDocumentType: "aadhaar" as IdentityDocumentType,
    idDocumentNumber: "",
    countryOfResidence: "India",
    ownershipEvidence: "Share Certificate",
  });

  // New Wallet form state
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({
    label: "",
    network: "ethereum" as BlockchainNetwork,
    address: "",
    walletType: "self_custody_software" as WalletType,
    verificationMethod: "screenshot_review" as WalletVerificationMethod,
  });

  // New Bank Account form state
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: "",
    accountType: "current" as BankAccountType,
    isPrimary: false,
  });

  const sectionSlots = getDocumentSlots(app, policy, sectionKey);

  const handleSaveDraft = () => {
    updateApplication(app.id, (cur) => cur, `Saved Step ${stepNum} (${sectionKey}) draft`);
    toast.success("Application draft saved");
  };

  const handleNextStep = () => {
    updateApplication(app.id, (cur) => cur);
    router.push(`/portal/applications/${app.id}/step/${stepNum + 1}`);
  };

  const handleSubmitFinal = () => {
    if (!confirmSubmit) {
      toast.error("Please confirm the accuracy declaration before submitting");
      return;
    }
    const submitted = submitApplication(app.id);
    toast.success(`Application ${submitted.reference} submitted for compliance review!`);
    router.push(`/portal/applications/${app.id}`);
  };

  const handleAddUbo = () => {
    if (!newUbo.fullName.trim() || !newUbo.pan.trim()) {
      toast.error("Please enter the UBO full name and PAN");
      return;
    }
    const owner: BeneficialOwner = {
      id: `ubo-${app.beneficialOwners.length + 1}-${newUbo.pan.trim().toLowerCase()}`,
      fullName: newUbo.fullName.trim(),
      ownershipPercentage: Number(newUbo.ownershipPercentage) || 25,
      role: newUbo.role,
      pan: newUbo.pan.trim().toUpperCase(),
      idDocumentType: newUbo.idDocumentType,
      idDocumentNumber: newUbo.idDocumentNumber || "XXXX XXXX 1234",
      residentialAddress: { ...app.business.registeredAddress },
      countryOfResidence: newUbo.countryOfResidence,
      ownershipEvidence: newUbo.ownershipEvidence,
    };
    updateApplication(
      app.id,
      (cur) => ({
        ...cur,
        beneficialOwners: [...cur.beneficialOwners, owner],
      }),
      `Added Beneficial Owner ${owner.fullName}`
    );
    setNewUbo({
      fullName: "",
      ownershipPercentage: 25,
      role: "Director & Shareholder",
      pan: "",
      idDocumentType: "aadhaar",
      idDocumentNumber: "",
      countryOfResidence: "India",
      ownershipEvidence: "Share Certificate",
    });
    setShowAddUbo(false);
    toast.success(`Added ${owner.fullName} as Beneficial Owner`);
  };

  const handleRemoveUbo = (uboId: string) => {
    updateApplication(
      app.id,
      (cur) => ({
        ...cur,
        beneficialOwners: cur.beneficialOwners.filter((u) => u.id !== uboId),
      }),
      "Removed Beneficial Owner"
    );
    toast.info("Removed Beneficial Owner");
  };

  const handleAddWallet = () => {
    if (!newWallet.label.trim() || !newWallet.address.trim()) {
      toast.error("Please enter a wallet label and address");
      return;
    }
    const wallet: Wallet = {
      id: `wallet-${app.wallets.length + 1}-${newWallet.address.trim().slice(0, 6)}`,
      label: newWallet.label.trim(),
      network: newWallet.network,
      address: newWallet.address.trim(),
      walletType: newWallet.walletType,
      ownershipDeclared: true,
      verificationMethod: newWallet.verificationMethod,
      verificationStatus: "pending",
    };
    updateApplication(
      app.id,
      (cur) => ({
        ...cur,
        wallets: [...cur.wallets, wallet],
      }),
      `Added Wallet ${wallet.label}`
    );
    setNewWallet({
      label: "",
      network: "ethereum",
      address: "",
      walletType: "self_custody_software",
      verificationMethod: "screenshot_review",
    });
    setShowAddWallet(false);
    toast.success(`Added wallet ${wallet.label}`);
  };

  const handleRemoveWallet = (walletId: string) => {
    updateApplication(
      app.id,
      (cur) => ({
        ...cur,
        wallets: cur.wallets.filter((w) => w.id !== walletId),
      }),
      "Removed Wallet"
    );
    toast.info("Removed wallet");
  };

  const handleAddBank = () => {
    if (!newBank.bankName.trim()) {
      toast.error("Please enter bank name");
      return;
    }
    if (!newBank.accountHolderName.trim()) {
      toast.error("Please enter account holder name");
      return;
    }
    if (!newBank.accountNumber.trim()) {
      toast.error("Please enter account number");
      return;
    }
    if (newBank.accountNumber.trim() !== newBank.confirmAccountNumber.trim()) {
      toast.error("Account numbers do not match");
      return;
    }
    if (!newBank.ifsc.trim()) {
      toast.error("Please enter bank IFSC code");
      return;
    }
    addBankAccount(app.id, {
      bankName: newBank.bankName.trim(),
      accountHolderName: newBank.accountHolderName.trim(),
      accountNumber: newBank.accountNumber.trim(),
      ifsc: newBank.ifsc.trim().toUpperCase(),
      accountType: newBank.accountType,
      isPrimary: newBank.isPrimary,
    });
    setNewBank({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifsc: "",
      accountType: "current",
      isPrimary: false,
    });
    setShowAddBank(false);
    toast.success("Bank account added! Please upload the corresponding supporting documents.");
  };

  const handleRemoveBank = (bankId: string) => {
    removeBankAccount(app.id, bankId);
    toast.info("Removed bank account");
  };

  const handleAddDirector = () => {
    if (!newDirector.fullName.trim()) {
      toast.error("Please enter director full name");
      return;
    }
    addDirector(app.id, newDirector);
    setNewDirector({
      fullName: "",
      designation: "Director",
      identificationNumber: "",
      pan: "",
      email: "",
      mobile: "",
    });
    setShowAddDirector(false);
    toast.success("Director added successfully");
  };

  const handleRemoveDirector = (dirId: string) => {
    removeDirector(app.id, dirId);
    toast.info("Removed director");
  };

  const totalUboPercent = app.beneficialOwners.reduce((acc, u) => acc + (Number(u.ownershipPercentage) || 0), 0);

  if (!hydrated) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-md bg-secondary" />
          <div className="h-4 w-80 rounded-md bg-secondary/70" />
        </div>
        <div className="h-16 w-full rounded-xl border bg-card" />
        <div className="h-96 w-full rounded-xl border bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding Application</h1>
          <p className="text-muted-foreground">
            {app.reference} • {app.business.legalName || "Corporate Entity"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/portal/applications/${app.id}/documents-generation`}>
              <Download className="mr-2 h-4 w-4" />
              Declarations Generator
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/portal/applications/${app.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Application
            </Link>
          </Button>
        </div>
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
            {stepNum === 1 && "Provide your business registration, tax identifiers, and registered address"}
            {stepNum === 2 && "Details and identity verification of the authorized corporate signatory"}
            {stepNum === 3 && `Declare all Ultimate Beneficial Owners with ≥${policy.uboThresholdPercent}% ownership`}
            {stepNum === 4 && "Corporate bank account details, expected volume, and source of funds"}
            {stepNum === 5 && "Register and verify corporate cryptocurrency wallets"}
            {stepNum === 6 && "Download, sign & acknowledge corporate declarations and record or upload your Video KYC"}
            {stepNum === 7 && "Review all sections and submit your onboarding application"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1: BUSINESS */}
          {stepNum === 1 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Business Name *</Label>
                  <Input
                    id="legalName"
                    value={app.business.legalName}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, legalName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entityType">Business Entity Type *</Label>
                  <Select
                    value={app.business.entityType || "private_limited"}
                    onValueChange={(val) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, entityType: val as EntityType },
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ENTITY_TYPE_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">Corporate PAN *</Label>
                  <Input
                    id="pan"
                    value={app.business.pan}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, pan: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cin">CIN / LLPIN / Registration Number *</Label>
                  <Input
                    id="cin"
                    value={app.business.registrationNumber}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, registrationNumber: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (if applicable)</Label>
                  <Input
                    id="gstin"
                    value={app.business.gstin}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, gstin: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incDate">Date of Incorporation *</Label>
                  <Input
                    id="incDate"
                    type="date"
                    value={app.business.incorporationDate}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, incorporationDate: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={app.business.email}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, email: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone *</Label>
                  <Input
                    id="phone"
                    value={app.business.phone}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        business: { ...cur.business, phone: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <p className="font-medium">Registered Office Address</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Address Line 1 *</Label>
                    <Input
                      value={app.business.registeredAddress.line1}
                      onChange={(e) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          business: {
                            ...cur.business,
                            registeredAddress: { ...cur.business.registeredAddress, line1: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={app.business.registeredAddress.line2}
                      onChange={(e) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          business: {
                            ...cur.business,
                            registeredAddress: { ...cur.business.registeredAddress, line2: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={app.business.registeredAddress.city}
                      onChange={(e) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          business: {
                            ...cur.business,
                            registeredAddress: { ...cur.business.registeredAddress, city: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select
                      value={app.business.registeredAddress.state || "Maharashtra"}
                      onValueChange={(val) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          business: {
                            ...cur.business,
                            registeredAddress: { ...cur.business.registeredAddress, state: val },
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>PIN / Postal Code *</Label>
                    <Input
                      value={app.business.registeredAddress.postalCode}
                      onChange={(e) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          business: {
                            ...cur.business,
                            registeredAddress: { ...cur.business.registeredAddress, postalCode: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* DIRECTORS & DESIGNATED PARTNERS LIST */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Directors &amp; Designated Partners ({(app.directors || []).length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      List all Directors / Partners. Live geo-tagged selfies and Video KYC will be verified for each.
                    </p>
                  </div>
                  {!showAddDirector && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddDirector(true)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Director
                    </Button>
                  )}
                </div>

                {(app.directors || []).length > 0 ? (
                  <div className="space-y-3">
                    {(app.directors || []).map((dir, idx) => (
                      <div
                        key={dir.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {idx + 1}. {dir.fullName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {dir.designation}
                            </Badge>
                            {dir.selfie ? (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                Geo-Photo Uploaded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                                Photo Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            DIN/DPIN: {dir.identificationNumber || "N/A"}
                            {dir.pan ? ` • PAN: ${dir.pan}` : ""}
                            {dir.email ? ` • ${dir.email}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7 px-2"
                          onClick={() => handleRemoveDirector(dir.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No directors listed yet. Click &quot;Add Director&quot; to add company directors.
                  </p>
                )}

                {showAddDirector && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-semibold">New Director Details</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Full Name *</Label>
                        <Input
                          value={newDirector.fullName}
                          onChange={(e) =>
                            setNewDirector((p) => ({ ...p, fullName: e.target.value }))
                          }
                          placeholder="e.g. Priya Nair"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Designation *</Label>
                        <Input
                          value={newDirector.designation}
                          onChange={(e) =>
                            setNewDirector((p) => ({ ...p, designation: e.target.value }))
                          }
                          placeholder="e.g. Director / Designated Partner"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">DIN / DPIN Number</Label>
                        <Input
                          value={newDirector.identificationNumber}
                          onChange={(e) =>
                            setNewDirector((p) => ({
                              ...p,
                              identificationNumber: e.target.value,
                            }))
                          }
                          placeholder="e.g. 01234567"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">PAN</Label>
                        <Input
                          value={newDirector.pan}
                          onChange={(e) =>
                            setNewDirector((p) => ({ ...p, pan: e.target.value.toUpperCase() }))
                          }
                          placeholder="e.g. ABCDE1234F"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="button" size="sm" onClick={handleAddDirector}>
                        Save Director
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddDirector(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 font-medium">Business Documents ({sectionSlots.length})</p>
                <div className="space-y-3">
                  {sectionSlots.map((slot) => (
                    <DocumentUploader
                      key={slot.requirement.key}
                      label={slot.label}
                      description={slot.requirement.description}
                      required={slot.required}
                      conditionLabel={slot.requirement.conditionLabel}
                      existingDocument={slot.document}
                      onUpload={(file) =>
                        uploadDocument(app.id, file, {
                          requirementKey: slot.requirement.key,
                          section: "business",
                          label: slot.label,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: SIGNATORY */}
          {stepNum === 2 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signName">Full Name *</Label>
                  <Input
                    id="signName"
                    value={app.signatory.fullName}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, fullName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={app.signatory.designation}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, designation: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signEmail">Email *</Label>
                  <Input
                    id="signEmail"
                    type="email"
                    value={app.signatory.email}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, email: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={app.signatory.mobile}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, mobile: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signPan">Signatory PAN *</Label>
                  <Input
                    id="signPan"
                    value={app.signatory.pan}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, pan: e.target.value.toUpperCase() },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={app.signatory.dateOfBirth}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, dateOfBirth: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Identity Document Type *</Label>
                  <Select
                    value={app.signatory.idDocumentType || "aadhaar"}
                    onValueChange={(val) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, idDocumentType: val as IdentityDocumentType },
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ID_DOCUMENT_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Identity Document Number *</Label>
                  <Input
                    value={app.signatory.idDocumentNumber}
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        signatory: { ...cur.signatory, idDocumentNumber: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 font-medium">Signatory Documents</p>
                <div className="space-y-3">
                  {sectionSlots.map((slot) => (
                    <DocumentUploader
                      key={slot.requirement.key}
                      label={slot.label}
                      description={slot.requirement.description}
                      required={slot.required}
                      existingDocument={slot.document}
                      onUpload={(file) =>
                        uploadDocument(app.id, file, {
                          requirementKey: slot.requirement.key,
                          section: "signatory",
                          label: slot.label,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STEP 3: UBO */}
          {stepNum === 3 && (
            <>
              <div className="space-y-4">
                {app.beneficialOwners.map((ubo, idx) => {
                  const uboSlots = sectionSlots.filter((s) => s.ownerRef === ubo.id);
                  return (
                    <div key={ubo.id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Beneficial Owner {idx + 1}: {ubo.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ubo.ownershipPercentage}% ownership • {ubo.role} • PAN: {ubo.pan}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveUbo(ubo.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {uboSlots.map((slot) => (
                          <DocumentUploader
                            key={`${slot.requirement.key}-${ubo.id}`}
                            label={`${slot.label} (${ubo.fullName})`}
                            description={slot.requirement.description}
                            existingDocument={slot.document}
                            onUpload={(file) =>
                              uploadDocument(app.id, file, {
                                requirementKey: slot.requirement.key,
                                section: "ubo",
                                ownerRef: ubo.id,
                                label: `${slot.label} - ${ubo.fullName}`,
                              })
                            }
                          />
                        ))}
                      </div>

                      {/* Individual Geo-Selfie Verification */}
                      <div className="pt-2 border-t">
                        <GeoSelfieRecorder
                          personName={ubo.fullName}
                          personRole={`UBO (${ubo.ownershipPercentage}%)`}
                          existingSelfie={ubo.selfie}
                          onSaveSelfie={(s) => saveUboSelfie(app.id, ubo.id, s)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {showAddUbo ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <p className="font-medium">Add Beneficial Owner</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Legal Name *</Label>
                      <Input
                        value={newUbo.fullName}
                        onChange={(e) => setNewUbo((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ownership Percentage (%) *</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={newUbo.ownershipPercentage}
                        onChange={(e) =>
                          setNewUbo((p) => ({ ...p, ownershipPercentage: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role / Relationship *</Label>
                      <Input
                        value={newUbo.role}
                        onChange={(e) => setNewUbo((p) => ({ ...p, role: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN *</Label>
                      <Input
                        value={newUbo.pan}
                        onChange={(e) => setNewUbo((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleAddUbo}>
                      Save Beneficial Owner
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddUbo(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setShowAddUbo(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Beneficial Owner
                </Button>
              )}

              <p className="text-sm text-muted-foreground">
                Total declared ownership: <strong>{totalUboPercent}%</strong>. UBO threshold:{" "}
                <strong>{policy.uboThresholdPercent}%</strong> (as per Pixelonics compliance policy).
              </p>
            </>
          )}

          {/* STEP 4: FINANCIAL */}
          {stepNum === 4 && (
            <>
              {/* BANK ACCOUNTS SECTION */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Corporate Bank Accounts ({((app.financial.bankAccounts && app.financial.bankAccounts.length > 0) ? app.financial.bankAccounts : [app.financial.bankAccount]).length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Add as many corporate bank accounts as needed. For every bank account added, upload the corresponding supporting documents separately.
                    </p>
                  </div>
                </div>

                {((app.financial.bankAccounts && app.financial.bankAccounts.length > 0)
                  ? app.financial.bankAccounts
                  : [{ ...app.financial.bankAccount, id: app.financial.bankAccount.id || "bank-1", isPrimary: true }]
                ).map((bank, idx) => {
                  const bankId = bank.id || `bank-${idx + 1}`;
                  const bankSlots = sectionSlots.filter((s) => s.ownerRef === bankId);
                  const satisfiedDocs = bankSlots.filter(isSlotSatisfied).length;

                  return (
                    <div key={bankId} className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
                      {/* BANK HEADER */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base text-foreground">
                              {bank.bankName || `Bank Account ${idx + 1}`}
                            </span>
                            {bank.isPrimary ? (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                Primary Account
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Secondary Account
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {bank.accountType ? BANK_ACCOUNT_TYPE_LABELS[bank.accountType] : "Current Account"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Holder: <span className="font-medium text-foreground">{bank.accountHolderName || app.business.legalName}</span> • A/C: <span className="font-mono">{bank.accountNumber || "Not entered"}</span> • IFSC: <span className="font-mono">{bank.ifsc || "Not entered"}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!bank.isPrimary && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => setPrimaryBankAccount(app.id, bankId)}
                            >
                              Set as Primary
                            </Button>
                          )}
                          {((app.financial.bankAccounts && app.financial.bankAccounts.length > 1) || false) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                              onClick={() => handleRemoveBank(bankId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* SUPPORTING DOCUMENTS FOR THIS BANK ACCOUNT */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Mandatory Supporting Documents for {bank.bankName || `Account #${idx + 1}`}
                          </p>
                          <Badge
                            variant={bankSlots.length > 0 && satisfiedDocs === bankSlots.length ? "default" : "outline"}
                            className={bankSlots.length > 0 && satisfiedDocs === bankSlots.length ? "bg-emerald-600 text-white text-[11px]" : "text-[11px]"}
                          >
                            {satisfiedDocs} of {bankSlots.length} Uploaded
                          </Badge>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {bankSlots.map((slot) => (
                            <DocumentUploader
                              key={`${slot.requirement.key}-${bankId}`}
                              label={`${slot.label} (${bank.bankName})`}
                              description={slot.requirement.description}
                              required={slot.required}
                              conditionLabel={slot.requirement.conditionLabel}
                              existingDocument={slot.document}
                              onUpload={(file) =>
                                uploadDocument(app.id, file, {
                                  requirementKey: slot.requirement.key,
                                  section: "financial",
                                  ownerRef: bankId,
                                  label: `${slot.label} - ${bank.bankName} (..${bank.accountNumber ? bank.accountNumber.slice(-4) : "A/C"})`,
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ADD BANK ACCOUNT BUTTON / FORM */}
                {showAddBank ? (
                  <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Add New Corporate Bank Account
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowAddBank(false)}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newBankName">Bank Name *</Label>
                        <Input
                          id="newBankName"
                          value={newBank.bankName}
                          onChange={(e) => setNewBank((p) => ({ ...p, bankName: e.target.value }))}
                          placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newAccHolder">Account Holder Name *</Label>
                        <Input
                          id="newAccHolder"
                          value={newBank.accountHolderName}
                          onChange={(e) => setNewBank((p) => ({ ...p, accountHolderName: e.target.value }))}
                          placeholder={app.business.legalName || "Corporate entity name"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newAccNo">Account Number *</Label>
                        <Input
                          id="newAccNo"
                          value={newBank.accountNumber}
                          onChange={(e) => setNewBank((p) => ({ ...p, accountNumber: e.target.value }))}
                          placeholder="e.g. 50100987654321"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmAccNo">Confirm Account Number *</Label>
                        <Input
                          id="confirmAccNo"
                          value={newBank.confirmAccountNumber}
                          onChange={(e) => setNewBank((p) => ({ ...p, confirmAccountNumber: e.target.value }))}
                          placeholder="Re-enter account number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newIfsc">Bank IFSC Code *</Label>
                        <Input
                          id="newIfsc"
                          value={newBank.ifsc}
                          onChange={(e) => setNewBank((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                          placeholder="e.g. HDFC0001234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Type *</Label>
                        <Select
                          value={newBank.accountType}
                          onValueChange={(val) =>
                            setNewBank((p) => ({ ...p, accountType: val as BankAccountType }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([k, label]) => (
                              <SelectItem key={k} value={k}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="isPrimaryBank"
                        checked={newBank.isPrimary}
                        onCheckedChange={(checked) =>
                          setNewBank((p) => ({ ...p, isPrimary: Boolean(checked) }))
                        }
                      />
                      <Label htmlFor="isPrimaryBank" className="text-xs font-medium cursor-pointer">
                        Set as Primary Corporate Bank Account for OTC settlements
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button type="button" onClick={handleAddBank}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Save Bank Account &amp; Proceed to Uploads
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddBank(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setShowAddBank(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Bank Account
                  </Button>
                )}
              </div>

              {/* SOURCE OF FUNDS & TRADING VOLUME PROFILE */}
              <div className="border-t pt-6 space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    Source of Funds &amp; Expected Volume Profile
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Provide financial projections and legitimate source of funds information for compliance underwriting.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sourceFunds">Source of Funds Category *</Label>
                    <Select
                      value={app.financial.sourceOfFundsCategory || "business_revenue"}
                      onValueChange={(val) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          financial: {
                            ...cur.financial,
                            sourceOfFundsCategory: val as SourceOfFundsCategory,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_OF_FUNDS_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Monthly Volume *</Label>
                    <Select
                      value={app.financial.expectedVolumeRange || VOLUME_RANGES[2]}
                      onValueChange={(val) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          financial: { ...cur.financial, expectedVolumeRange: val },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLUME_RANGES.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expected Transaction Frequency *</Label>
                    <Select
                      value={app.financial.expectedFrequency || TRANSACTION_FREQUENCIES[2]}
                      onValueChange={(val) =>
                        updateApplication(app.id, (cur) => ({
                          ...cur,
                          financial: { ...cur.financial, expectedFrequency: val },
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Source of Funds Explanation *</Label>
                  <Textarea
                    value={app.financial.sourceOfFundsExplanation}
                    placeholder="Describe how the company generates the capital used for OTC crypto trading..."
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        financial: { ...cur.financial, sourceOfFundsExplanation: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trading Activity Description *</Label>
                  <Textarea
                    value={app.financial.tradingActivityDescription}
                    placeholder="Describe the nature of corporate trading activities (hedging, treasury operations, liquidity provision, etc.)..."
                    onChange={(e) =>
                      updateApplication(app.id, (cur) => ({
                        ...cur,
                        financial: { ...cur.financial, tradingActivityDescription: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 5: WALLETS */}
          {stepNum === 5 && (
            <>
              <div className="space-y-4">
                {app.wallets.map((w, idx) => {
                  const walletSlots = sectionSlots.filter((s) => s.ownerRef === w.id);
                  return (
                    <div key={w.id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            Wallet {idx + 1}: {w.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {w.network ? NETWORK_LABELS[w.network] : "-"} •{" "}
                            {w.walletType ? WALLET_TYPE_LABELS[w.walletType] : "-"}
                          </p>
                          <p className="mt-1 font-mono text-xs">{w.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{WALLET_STATUS_LABELS[w.verificationStatus]}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRemoveWallet(w.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {walletSlots.map((slot) => (
                          <DocumentUploader
                            key={`${slot.requirement.key}-${w.id}`}
                            label={`${slot.label} (${w.label})`}
                            description={slot.requirement.description}
                            required={slot.required}
                            existingDocument={slot.document}
                            onUpload={(file) =>
                              uploadDocument(app.id, file, {
                                requirementKey: slot.requirement.key,
                                section: "wallets",
                                ownerRef: w.id,
                                label: `${slot.label} - ${w.label}`,
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {showAddWallet ? (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <p className="font-medium">Add Corporate Crypto Wallet</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Wallet Label *</Label>
                      <Input
                        value={newWallet.label}
                        onChange={(e) => setNewWallet((p) => ({ ...p, label: e.target.value }))}
                        placeholder="e.g. Treasury Multisig Vault"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Blockchain Network *</Label>
                      <Select
                        value={newWallet.network}
                        onValueChange={(val) =>
                          setNewWallet((p) => ({ ...p, network: val as BlockchainNetwork }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(NETWORK_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Wallet Address *</Label>
                      <Input
                        value={newWallet.address}
                        onChange={(e) => setNewWallet((p) => ({ ...p, address: e.target.value }))}
                        placeholder="0x..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custody / Wallet Type *</Label>
                      <Select
                        value={newWallet.walletType}
                        onValueChange={(val) =>
                          setNewWallet((p) => ({ ...p, walletType: val as WalletType }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(WALLET_TYPE_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Verification Method</Label>
                      <Select
                        value={newWallet.verificationMethod}
                        onValueChange={(val) =>
                          setNewWallet((p) => ({
                            ...p,
                            verificationMethod: val as WalletVerificationMethod,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(WALLET_METHOD_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleAddWallet}>
                      Save Wallet
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddWallet(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setShowAddWallet(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Wallet
                </Button>
              )}
            </>
          )}

          {/* STEP 6: DECLARATIONS & VIDEO KYC */}
          {stepNum === 6 && (
            <>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      Corporate Declarations &amp; Undertakings ({app.declarations.length} Required)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Download the official document templates, place them on your company letterhead, fill in all required details, and upload the completed documents.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/portal/applications/${app.id}/documents-generation`}>
                      Open Full Declarations Workspace
                    </Link>
                  </Button>
                </div>

                {/* Important Letterhead & Execution Instructions Banner */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground space-y-2 dark:bg-amber-950/30 dark:border-amber-500/40">
                  <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4" />
                    <span>Company Letterhead &amp; Upload Instructions</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground leading-relaxed">
                    <li>
                      <strong>Download Document Templates:</strong> Download the official Word template (<code>.docx</code>) or pre-filled PDF for each required declaration below.
                    </li>
                    <li>
                      <strong>Place on Company Letterhead:</strong> Print or copy the document directly onto your official <strong>Company Letterhead</strong>.
                    </li>
                    <li>
                      <strong>Fill All Required Details:</strong> Complete all required fields, ensuring legal entity and signatory details match corporate records.
                    </li>
                    <li>
                      <strong>Sign, Stamp &amp; Upload:</strong> Have the authorized signatory sign, affix the official corporate seal / stamp, and upload the executed document (PDF, DOC, DOCX, Image, or any file format) below.
                    </li>
                  </ol>
                </div>

                {/* Declarations List with Download & Upload */}
                <div className="space-y-4">
                  {app.declarations.map((decl) => {
                    const uploadedDoc = app.documents.find(
                      (d) => d.requirementKey === `signed_${decl.key}`
                    );

                    return (
                      <div
                        key={decl.key}
                        className="rounded-xl border bg-card p-4 space-y-3 transition-colors hover:border-primary/40"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{decl.name}</span>
                              <Badge variant="outline" className="text-xs font-normal">
                                Letterhead Required
                              </Badge>
                              {decl.requiresStamp && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  Stamp &amp; Seal Required
                                </Badge>
                              )}
                              {uploadedDoc ? (
                                <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Completed &amp; Uploaded
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Upload Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{decl.description}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await downloadDeclarationDocument(app, decl.key as DeclarationKey, "docx");
                                toast.success(`Downloaded Word template (.docx) for ${decl.name}`);
                              }}
                            >
                              <FileText className="mr-1.5 h-3.5 w-3.5 text-primary" />
                              Download Template (.docx)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await downloadDeclarationDocument(app, decl.key as DeclarationKey, "pdf");
                                toast.success(`Downloaded pre-filled ${decl.name} (PDF)`);
                              }}
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                              Download Pre-filled PDF
                            </Button>
                          </div>
                        </div>

                        {/* Document Uploader for this declaration */}
                        <div className="pt-2 border-t border-border/40">
                          <DocumentUploader
                            label={`Upload Completed ${decl.name}`}
                            description="Upload executed document on company letterhead with signature & stamp (PDF, DOC/DOCX, Image, or any file format)"
                            required={true}
                            existingDocument={uploadedDoc}
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
                                    ? {
                                        ...d,
                                        acknowledged: true,
                                        acknowledgedAt: new Date().toISOString(),
                                      }
                                    : d
                                ),
                              }));
                              toast.success(`Uploaded executed ${decl.name}`);
                            }}
                          />
                        </div>

                        {/* Acknowledgment Confirmation */}
                        <div className="flex items-center space-x-2 pt-1">
                          <Checkbox
                            id={`ack-${decl.key}`}
                            checked={decl.acknowledged}
                            onCheckedChange={(checked) =>
                              updateApplication(app.id, (cur) => ({
                                ...cur,
                                declarations: cur.declarations.map((d) =>
                                  d.key === decl.key
                                    ? {
                                        ...d,
                                        acknowledged: Boolean(checked),
                                        acknowledgedAt: checked ? new Date().toISOString() : undefined,
                                      }
                                    : d
                                ),
                              }))
                            }
                          />
                          <Label htmlFor={`ack-${decl.key}`} className="text-xs text-muted-foreground cursor-pointer">
                            I confirm that this document has been placed on company letterhead, fully filled, signed, and stamped.
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GEO-LOCATION TAGGED PHOTO VERIFICATION FOR DIRECTORS & UBOS */}
              <div className="border-t pt-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <span>Geo-Location Photo Verification (Directors &amp; UBOs)</span>
                    <Badge variant="secondary" className="text-xs">
                      {(app.directors || []).length} Directors • {(app.beneficialOwners || []).length} UBOs
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Regulatory requirement: Upload existing photos taken with a GPS Map Camera app for all Directors and Ultimate Beneficial Owners (UBOs), showing person&apos;s face with the stamped location, coordinates, and timestamp. Direct device camera capture is disabled.
                  </p>
                </div>

                {/* Directors Photos */}
                <div className="space-y-4">
                  <p className="font-semibold text-xs text-foreground uppercase tracking-wider">
                    Directors Geo-Tagged Photos ({(app.directors || []).length})
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(app.directors || []).map((dir) => (
                      <GeoSelfieRecorder
                        key={dir.id}
                        personName={dir.fullName}
                        personRole={dir.designation}
                        existingSelfie={dir.selfie}
                        onSaveSelfie={(selfie) => saveDirectorSelfie(app.id, dir.id, selfie)}
                      />
                    ))}
                  </div>
                </div>

                {/* Beneficial Owners Photos */}
                <div className="space-y-4 pt-2">
                  <p className="font-semibold text-xs text-foreground uppercase tracking-wider">
                    Ultimate Beneficial Owners (UBOs) Geo-Tagged Photos ({(app.beneficialOwners || []).length})
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {(app.beneficialOwners || []).map((ubo) => (
                      <GeoSelfieRecorder
                        key={ubo.id}
                        personName={ubo.fullName}
                        personRole={`UBO (${ubo.ownershipPercentage}%)`}
                        existingSelfie={ubo.selfie}
                        onSaveSelfie={(selfie) => saveUboSelfie(app.id, ubo.id, selfie)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AUTHORIZED SIGNATORY MASTER VIDEO KYC */}
              <div className="border-t pt-8 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    Authorized Signatory Master Video KYC
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Master corporate declaration recorded by the Authorized Signatory on behalf of the company and all listed directors &amp; beneficial owners.
                  </p>
                </div>
                <VideoKycRecorder
                  app={app}
                  onUploadVideo={(file, spokenScript) => uploadVideoKyc(app.id, file, spokenScript)}
                />
              </div>
            </>
          )}

          {/* STEP 7: REVIEW & SUBMIT */}
          {stepNum === 7 && (
            <>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">1. Business Information</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/1`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.business.legalName || "Not set"} •{" "}
                    {app.business.entityType ? ENTITY_TYPE_LABELS[app.business.entityType] : "-"} • PAN:{" "}
                    {app.business.pan || "-"} • CIN: {app.business.registrationNumber || "-"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">2. Authorized Signatory</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/2`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.signatory.fullName || "Not set"} • {app.signatory.designation || "-"} •{" "}
                    {app.signatory.email || "-"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">3. Beneficial Owners (UBOs)</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/3`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.beneficialOwners.length} owner(s) • Total {totalUboPercent}% ownership declared
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">4. Financial Information</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/4`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {((app.financial.bankAccounts && app.financial.bankAccounts.length > 0)
                      ? app.financial.bankAccounts
                      : [app.financial.bankAccount]
                    )
                      .map((b) => `${b.bankName || "Bank"} (${b.accountNumber ? `A/C ..${b.accountNumber.slice(-4)}` : "-"})`)
                      .join(", ")}{" "}
                    • Expected Volume: {app.financial.expectedVolumeRange || "-"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">5. Crypto Wallets</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/5`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.wallets.length} wallet(s) registered •{" "}
                    {app.documents.length} total supporting documents uploaded
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">6. Declarations &amp; Video KYC</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/portal/applications/${app.id}/step/6`}>Edit</Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {app.declarations.filter((d) => d.acknowledged).length}/{app.declarations.length} declarations
                    acknowledged • Video KYC: {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmSubmit}
                  onCheckedChange={(c) => setConfirmSubmit(Boolean(c))}
                />
                <Label htmlFor="confirm" className="text-sm">
                  I confirm that all corporate KYC particulars, beneficial ownership details, and uploaded documents are true and accurate.
                </Label>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-6">
            <div className="flex gap-2">
              {stepNum > 1 && (
                <Button variant="outline" asChild>
                  <Link href={`/portal/applications/${app.id}/step/${stepNum - 1}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Link>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
            {stepNum < 7 ? (
              <Button type="button" onClick={handleNextStep}>
                Save &amp; Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmitFinal}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submit Application ({app.reference})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
