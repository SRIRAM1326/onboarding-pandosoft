"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  FileSearch,
  Check,
  AlertCircle,
  RefreshCw,
  FileText,
  Lock,
  Eye,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { Application, ApplicationDocument } from "@/lib/types";
import type { BharatOcrScanResult, OcrFieldResult } from "@/lib/types/bharat-ocr";
import { BHARAT_OCR_DISCLAIMER, scanDocumentWithBharatOcr } from "@/lib/utils/bharat-ocr-engine";
import { toast } from "sonner";

interface BharatOcrCardProps {
  document: ApplicationDocument;
  application?: Application;
  isPixelonicsOfficer?: boolean;
  onVerifyBharatOcr?: (options: {
    confirmChanges: boolean;
    verifiedFields: Record<string, string>;
    notes: string;
  }) => void;
  onRequestReplacement?: (notes: string) => void;
}

export function BharatOcrCard({
  document,
  application,
  isPixelonicsOfficer = true,
  onVerifyBharatOcr,
  onRequestReplacement,
}: BharatOcrCardProps) {
  // If document does not already have bharatOcr, compute it on the fly
  const [scanResult, setScanResult] = useState<BharatOcrScanResult>(() => {
    return document.bharatOcr || scanDocumentWithBharatOcr(document, application);
  });

  const [showRawText, setShowRawText] = useState(false);
  const [officerNotes, setOfficerNotes] = useState(
    scanResult.pixelonicsVerification.reviewNotes || ""
  );
  const [confirmUpdateApp, setConfirmUpdateApp] = useState(false);
  const [reviewedOriginalChecked, setReviewedOriginalChecked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Field edits / confirmed values
  const [confirmedValues, setConfirmedValues] = useState<Record<string, string>>({
    fullName: scanResult.fields.fullName?.extractedValue || "",
    panNumber: scanResult.fields.panNumber?.suggestedValue || scanResult.fields.panNumber?.extractedValue || "",
    aadhaarNumber: scanResult.fields.aadhaarNumber?.suggestedValue || scanResult.fields.aadhaarNumber?.extractedValue || "",
    dateOfBirth: scanResult.fields.dateOfBirth?.extractedValue || "",
  });

  const handleApplySuggestion = (fieldKey: string, suggested: string) => {
    setConfirmedValues((prev) => ({ ...prev, [fieldKey]: suggested }));
    toast.info(`Applied suggested correction "${suggested}". Requires Pixelonics confirmation to update.`);
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const fresh = scanDocumentWithBharatOcr(document, application);
      setScanResult(fresh);
      setConfirmedValues({
        fullName: fresh.fields.fullName?.extractedValue || "",
        panNumber: fresh.fields.panNumber?.suggestedValue || fresh.fields.panNumber?.extractedValue || "",
        aadhaarNumber: fresh.fields.aadhaarNumber?.suggestedValue || fresh.fields.aadhaarNumber?.extractedValue || "",
        dateOfBirth: fresh.fields.dateOfBirth?.extractedValue || "",
      });
      setIsScanning(false);
      toast.success("BharatOCR re-scan completed successfully.");
    }, 600);
  };

  const handleConfirmVerification = () => {
    if (!reviewedOriginalChecked) {
      toast.error("Please confirm that you have reviewed the original unmodified document.");
      return;
    }

    onVerifyBharatOcr?.({
      confirmChanges: confirmUpdateApp,
      verifiedFields: confirmedValues,
      notes: officerNotes.trim() || "Verified by Pixelonics Operations",
    });

    setScanResult((prev) => ({
      ...prev,
      overallStatus: "verified_match",
      pixelonicsVerification: {
        isVerified: true,
        verifiedBy: "Pixelonics Operations",
        verifiedAt: new Date().toISOString(),
        reviewNotes: officerNotes.trim() || "Verified by Pixelonics Operations",
        changesConfirmed: confirmUpdateApp,
      },
    }));

    toast.success(
      confirmUpdateApp
        ? "Extracted details verified and confirmed to application record!"
        : "Extracted details verified by Pixelonics Ops!"
    );
  };

  const getStatusBadge = () => {
    if (scanResult.pixelonicsVerification.isVerified) {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Pixelonics Verified
        </Badge>
      );
    }
    switch (scanResult.overallStatus) {
      case "verified_match":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            OCR Match (Pending Review)
          </Badge>
        );
      case "mismatch_flagged":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Mismatch Flagged
          </Badge>
        );
      case "unclear_manual_review":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Unclear Character (Review Required)
          </Badge>
        );
      case "format_error_flagged":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 border-purple-300 dark:text-purple-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Format Error Flagged
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-sky-600 border-sky-300">
            Pending Pixelonics Review
          </Badge>
        );
    }
  };

  const renderFieldRow = (field?: OcrFieldResult) => {
    if (!field) return null;

    const hasErrors = field.detectedErrors.length > 0;
    const isUnclear = !field.isClear;
    const isMismatch = field.comparisonStatus === "mismatch";
    const isFormatError = !field.formatValid;

    return (
      <div
        key={field.key}
        className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
          isMismatch || isFormatError
            ? "border-rose-300/80 bg-rose-50/30 dark:bg-rose-950/20"
            : isUnclear
            ? "border-amber-300/80 bg-amber-50/30 dark:bg-amber-950/20"
            : "border-border/60 bg-card hover:border-primary/30"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{field.label}</span>
            {field.confidence && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {field.confidence}% confidence
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {field.comparisonStatus === "match" && (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                ✓ Matched Application
              </Badge>
            )}
            {field.comparisonStatus === "mismatch" && (
              <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-300">
                ⚠ Mismatch
              </Badge>
            )}
            {!field.isClear && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                ? Unclear Character
              </Badge>
            )}
            {!field.formatValid && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-300">
                ✕ Format Invalid
              </Badge>
            )}
          </div>
        </div>

        {/* COMPARISON GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-background/80 border p-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Extracted from Document:
            </span>
            <span className="font-mono font-semibold text-foreground text-sm">
              {field.extractedValue || <span className="italic text-muted-foreground">Not detected</span>}
            </span>
          </div>

          <div className="rounded-lg bg-background/80 border p-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Application Entered Value:
            </span>
            <span className="font-mono text-foreground text-sm">
              {field.enteredValue || <span className="italic text-muted-foreground">Not provided in form</span>}
            </span>
          </div>
        </div>

        {/* FORMAT VALIDATION NOTE */}
        {field.formatErrorNote && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {field.formatErrorNote}
          </p>
        )}

        {/* DETECTED OCR ERRORS & SUGGESTIONS */}
        {hasErrors && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-300/50 p-2.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>BharatOCR Character Misread Analysis:</span>
            </div>
            {field.detectedErrors.map((err, idx) => (
              <div key={idx} className="text-[11px] text-amber-900 dark:text-amber-200 pl-4 border-l-2 border-amber-400">
                <p>{err.reason}</p>
                {err.suggestedChar && (
                  <p className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
                    Pos {err.position}: &apos;{err.rawChar}&apos; ➔ Suggested &apos;{err.suggestedChar}&apos; ({err.confidence}% confidence)
                  </p>
                )}
              </div>
            ))}
            {field.suggestedValue && (
              <div className="flex items-center justify-between pt-1 gap-2">
                <span className="text-[11px] font-medium text-foreground">
                  Suggested Full Value: <strong className="font-mono text-primary">{field.suggestedValue}</strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-100"
                  onClick={() => handleApplySuggestion(field.key, field.suggestedValue!)}
                >
                  Apply Suggestion
                </Button>
              </div>
            )}
          </div>
        )}

        {/* UNCLEAR CHARACTERS WARNING */}
        {isUnclear && (
          <div className="rounded-lg bg-purple-500/10 border border-purple-300/50 p-2 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px]">
              <strong>Character Unclear:</strong> One or more characters on the physical card appear smudged or ambiguous. Per policy, this is flagged for manual Pixelonics review.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-primary/20 shadow-sm overflow-hidden">
      {/* HEADER */}
      <CardHeader className="bg-muted/30 pb-3 border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              BOCR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  BharatOCR Document Analysis
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription className="text-xs">
                {scanResult.documentTypeLabel} • Automated entity extraction &amp; format validation
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={isScanning}
              onClick={handleRescan}
            >
              <RefreshCw className={`h-3 w-3 ${isScanning ? "animate-spin" : ""}`} />
              Re-Scan
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowRawText((v) => !v)}
            >
              {showRawText ? "Hide Text" : "Raw OCR Text"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* COMPLIANCE DISCLAIMER ALERT */}
        <div className="rounded-xl border border-amber-300/80 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Important Compliance &amp; Verification Rules</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {BHARAT_OCR_DISCLAIMER} Original document binary is preserved unmodified. Any update to PAN or Aadhaar numbers requires explicit officer confirmation.
          </p>
        </div>

        {/* ERROR FLAGS SUMMARY (IF ANY) */}
        {(scanResult.errorFlags.mismatched.length > 0 ||
          scanResult.errorFlags.invalid.length > 0 ||
          scanResult.errorFlags.unclear.length > 0 ||
          scanResult.errorFlags.missing.length > 0) && (
          <div className="rounded-xl border border-rose-300/80 bg-rose-50/40 dark:bg-rose-950/20 p-3 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Flagged Items for Manual Pixelonics Review:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              {scanResult.errorFlags.mismatched.map((msg, i) => (
                <li key={`mis-${i}`} className="text-rose-800 dark:text-rose-300 font-medium">
                  {msg}
                </li>
              ))}
              {scanResult.errorFlags.invalid.map((msg, i) => (
                <li key={`inv-${i}`} className="text-rose-800 dark:text-rose-300 font-medium">
                  {msg}
                </li>
              ))}
              {scanResult.errorFlags.unclear.map((msg, i) => (
                <li key={`unc-${i}`} className="text-amber-800 dark:text-amber-300 font-medium">
                  {msg}
                </li>
              ))}
              {scanResult.errorFlags.missing.map((msg, i) => (
                <li key={`mis-${i}`} className="text-muted-foreground">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* RAW OCR TEXT DRAWER */}
        {showRawText && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>BharatOCR Character Extraction Stream:</span>
              <span className="font-mono text-[10px]">Scanned: {new Date(scanResult.scannedAt).toLocaleTimeString()}</span>
            </div>
            <pre className="max-h-40 overflow-y-auto rounded-xl border bg-slate-950 text-slate-100 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
              {scanResult.rawExtractedText}
            </pre>
          </div>
        )}

        {/* EXTRACTED FIELDS LIST */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Extracted Fields &amp; Cross-Verification
          </p>
          {renderFieldRow(scanResult.fields.fullName)}
          {renderFieldRow(scanResult.fields.panNumber)}
          {renderFieldRow(scanResult.fields.aadhaarNumber)}
          {renderFieldRow(scanResult.fields.dateOfBirth)}
          {renderFieldRow(scanResult.fields.gender)}
          {renderFieldRow(scanResult.fields.fatherName)}
        </div>

        {/* PIXELONICS VERIFICATION & CONFIRMATION SECTION */}
        {isPixelonicsOfficer && (
          <div className="rounded-xl border bg-card p-4 space-y-3.5 pt-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Pixelonics Operations Verification
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Initial Verification Authority
              </span>
            </div>

            {/* CONFIRMATION CHECKBOXES */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Checkbox
                  id={`review-orig-${document.id}`}
                  checked={reviewedOriginalChecked}
                  onCheckedChange={(c) => setReviewedOriginalChecked(Boolean(c))}
                  className="mt-0.5"
                />
                <Label htmlFor={`review-orig-${document.id}`} className="text-xs font-normal leading-snug cursor-pointer">
                  I confirm I have inspected the original unmodified uploaded document and checked extracted characters against it.
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id={`confirm-update-${document.id}`}
                  checked={confirmUpdateApp}
                  onCheckedChange={(c) => setConfirmUpdateApp(Boolean(c))}
                  className="mt-0.5"
                />
                <Label htmlFor={`confirm-update-${document.id}`} className="text-xs font-normal leading-snug cursor-pointer text-muted-foreground">
                  <span className="font-semibold text-foreground">Explicit Confirmation:</span> Allow updating application PAN / Aadhaar record with the verified values if there was a typo or OCR correction. (Never changed automatically).
                </Label>
              </div>
            </div>

            {/* OFFICER NOTES */}
            <div className="space-y-1">
              <Label htmlFor={`notes-${document.id}`} className="text-xs font-medium">
                Officer Review Notes
              </Label>
              <Textarea
                id={`notes-${document.id}`}
                placeholder="Enter verification remarks, note character legibility, or reason for correction..."
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                onClick={handleConfirmVerification}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Confirm &amp; Verify Details
              </Button>

              <Button
                type="button"
                variant="outline"
                className="text-amber-600 hover:text-amber-700 border-amber-300 text-xs h-8"
                onClick={() => {
                  const reason = officerNotes.trim() || "Document image is unclear or details mismatch. Please re-upload.";
                  onRequestReplacement?.(reason);
                  toast.warning("Requested document replacement from customer.");
                }}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Flag for Replacement
              </Button>
            </div>
          </div>
        )}

        {/* IF ALREADY VERIFIED */}
        {scanResult.pixelonicsVerification.isVerified && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-300/50 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Verified by Pixelonics Operations
              </p>
              <p className="text-[11px] text-muted-foreground">
                Verified on {new Date(scanResult.pixelonicsVerification.verifiedAt || Date.now()).toLocaleString()}
                {scanResult.pixelonicsVerification.reviewNotes && ` • Notes: "${scanResult.pixelonicsVerification.reviewNotes}"`}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                Changes confirmed to application: {scanResult.pixelonicsVerification.changesConfirmed ? "YES (Confirmed)" : "NO (Kept as is)"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
