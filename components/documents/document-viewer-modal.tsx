"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  AlertCircle,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Calendar,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_STATUS_LABELS, SECTION_LABELS } from "@/lib/constants/labels";
import type { Application, ApplicationDocument, DocumentStatus } from "@/lib/types";
import {
  isImageFile,
  isPdfFile,
  isWordFile,
  isTextFile,
  isSpreadsheetFile,
  getDocumentFormatLabel,
  getSimulatedDocumentPreview,
  getDocumentTextDetails,
} from "@/lib/utils/document-previews";
import { getDocumentBlob } from "@/lib/utils/document-db";
import { toast } from "sonner";

interface DocumentViewerModalProps {
  document: ApplicationDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify?: (docId: string, notes?: string) => void;
  onReject?: (docId: string, notes?: string) => void;
  application?: Application;
  allDocuments?: ApplicationDocument[];
  onSelectDocument?: (doc: ApplicationDocument) => void;
  isOfficer?: boolean;
}

export function DocumentViewerModal({
  document: currentDoc,
  isOpen,
  onClose,
  onVerify,
  onReject,
  application,
  allDocuments,
  onSelectDocument,
  isOfficer = true,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [pdfFrameError, setPdfFrameError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"file" | "paper" | "vector">("file");
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);

  // Synchronize state cleanly when document changes
  useEffect(() => {
    if (currentDoc) {
      setReviewerNotes(currentDoc.reviewerNotes || "");
      setZoom(1);
      setRotation(0);
      setPdfFrameError(false);
      // Prioritize live customer uploaded file
      setViewMode("file");
    }
  }, [currentDoc?.id, currentDoc?.previewUrl, currentDoc?.reviewerNotes]);

  // Attempt to restore actual Blob from IndexedDB if previewUrl is missing
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (currentDoc && !currentDoc.previewUrl) {
      getDocumentBlob(currentDoc.id).then((blob) => {
        if (active && blob) {
          try {
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
            setViewMode("file");
          } catch {
            // ignore
          }
        }
      });
    }

    return () => {
      active = false;
      if (createdUrl) {
        try {
          URL.revokeObjectURL(createdUrl);
        } catch {
          // ignore
        }
      }
      setBlobUrl(null);
    };
  }, [currentDoc?.id, currentDoc?.previewUrl]);

  const isImage = isImageFile(currentDoc?.fileName, currentDoc?.mimeType);
  const isPdf = isPdfFile(currentDoc?.fileName, currentDoc?.mimeType);
  const isWord = isWordFile(currentDoc?.fileName, currentDoc?.mimeType);
  const isText = isTextFile(currentDoc?.fileName, currentDoc?.mimeType);
  const isSpreadsheet = isSpreadsheetFile(currentDoc?.fileName, currentDoc?.mimeType);
  const formatLabel = getDocumentFormatLabel(currentDoc?.fileName, currentDoc?.mimeType);

  // Fetch extracted text for Word documents (.docx) or plain text documents
  useEffect(() => {
    let active = true;
    if (isOpen && currentDoc?.fileName && (isWord || isText)) {
      setLoadingText(true);
      fetch(`/api/documents?file=${encodeURIComponent(currentDoc.fileName)}&preview=text`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active && data?.text) {
            setExtractedText(data.text);
          } else if (active) {
            setExtractedText(null);
          }
        })
        .catch(() => {
          if (active) setExtractedText(null);
        })
        .finally(() => {
          if (active) setLoadingText(false);
        });
    } else {
      setExtractedText(null);
      setLoadingText(false);
    }
    return () => {
      active = false;
    };
  }, [isOpen, currentDoc?.id, currentDoc?.fileName, isWord, isText]);

  if (!isOpen || !currentDoc) return null;

  // Effective preview URL: stored previewUrl, restored blobUrl, or direct route
  const effectiveFileUrl =
    currentDoc.previewUrl ||
    blobUrl ||
    (currentDoc.fileName ? `/api/documents?file=${encodeURIComponent(currentDoc.fileName)}` : null);
  const svgPreviewUrl = getSimulatedDocumentPreview(currentDoc, application);
  const isSimulated = !effectiveFileUrl;
  const docDetails = getDocumentTextDetails(currentDoc, application);

  const currentIndex = allDocuments
    ? allDocuments.findIndex((d) => d.id === currentDoc.id)
    : -1;
  const hasPrev = allDocuments && currentIndex > 0;
  const hasNext = allDocuments && currentIndex >= 0 && currentIndex < allDocuments.length - 1;

  const handlePrev = () => {
    if (hasPrev && allDocuments && onSelectDocument) {
      onSelectDocument(allDocuments[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && allDocuments && onSelectDocument) {
      onSelectDocument(allDocuments[currentIndex + 1]);
    }
  };

  const handleVerify = () => {
    onVerify?.(currentDoc.id, reviewerNotes.trim() || "Verified by Officer");
    toast.success(`Verified document: ${currentDoc.label}`);
    if (hasNext) {
      handleNext();
    }
  };

  const handleRequestReplacement = () => {
    const notes = reviewerNotes.trim() || "Replacement requested: Please re-upload a clear, valid document.";
    onReject?.(currentDoc.id, notes);
    toast.warning(`Flagged for replacement: ${currentDoc.label}`);
  };

  const statusBadgeVariant = (status: DocumentStatus) => {
    switch (status) {
      case "verified_demo":
        return "bg-emerald-600 text-white hover:bg-emerald-700";
      case "replacement_required":
        return "bg-amber-600 text-white hover:bg-amber-700";
      case "rejected_demo":
        return "bg-rose-600 text-white hover:bg-rose-700";
      default:
        return "bg-sky-600 text-white hover:bg-sky-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? "w-full h-full max-w-none max-h-none rounded-none"
            : "w-full max-w-6xl max-h-[92vh] h-[88vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between border-b px-5 py-3.5 bg-card/95 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold truncate text-foreground">
                  {currentDoc.label}
                </h2>
                <Badge className={statusBadgeVariant(currentDoc.status)}>
                  {DOCUMENT_STATUS_LABELS[currentDoc.status]}
                </Badge>
                {isSimulated ? (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    Verified Digital Record
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">
                    Customer Uploaded File
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {application?.business.legalName ? `${application.business.legalName} • ` : ""}
                {application?.reference ? `${application.reference} • ` : ""}
                Section: {SECTION_LABELS[currentDoc.section] || currentDoc.section}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {allDocuments && allDocuments.length > 1 && (
              <div className="flex items-center mr-2 rounded-lg border bg-muted/40 p-0.5 text-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!hasPrev}
                  onClick={handlePrev}
                  title="Previous Document"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-medium text-muted-foreground">
                  {currentIndex + 1} / {allDocuments.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!hasNext}
                  onClick={handleNext}
                  title="Next Document"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {effectiveFileUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 gap-1.5 text-xs"
                onClick={() => window.open(effectiveFileUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                New Tab
              </Button>
            )}

            {effectiveFileUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 gap-1.5 text-xs"
                asChild
              >
                <a href={effectiveFileUrl} download={currentDoc.fileName}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Close Viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* METADATA BAR */}
        <div className="flex flex-wrap items-center justify-between border-b bg-muted/30 px-5 py-2 text-xs text-muted-foreground gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 font-mono text-foreground font-medium">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {currentDoc.fileName}
            </span>
            <span>{(currentDoc.fileSize / 1024).toFixed(1)} KB</span>
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {formatLabel}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Version {currentDoc.version}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(currentDoc.uploadedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-md border bg-background p-0.5 text-[11px]">
              {effectiveFileUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode("file")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    viewMode === "file"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Uploaded File
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode("paper")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  viewMode === "paper"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Document View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("vector")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  viewMode === "vector"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vector Spec
              </button>
            </div>

            {/* Zoom / Rotation controls */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="px-1 text-xs">{Math.round(zoom * 100)}%</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 ml-1"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW (DOCUMENT CANVAS + REVIEW PANEL) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* DOCUMENT CANVAS CONTAINER */}
          <div className="flex-1 overflow-auto bg-slate-900/95 flex flex-col items-center justify-start p-4 sm:p-6 relative min-h-0">
            {/* 1. ACTUAL LIVE PDF EMBEDDED IFRAME */}
            {viewMode === "file" && isPdf && effectiveFileUrl && !pdfFrameError ? (
              <div className="w-full h-full flex flex-col rounded-lg overflow-hidden border border-slate-700 bg-white shadow-2xl min-h-[500px]">
                <iframe
                  src={`${effectiveFileUrl}#toolbar=1`}
                  title={currentDoc.fileName}
                  className="w-full h-full flex-1 min-h-[500px]"
                  onError={() => {
                    setPdfFrameError(true);
                    setViewMode("paper");
                  }}
                />
              </div>
            ) : viewMode === "file" && isImage && effectiveFileUrl ? (
              /* 2. ACTUAL UPLOADED IMAGE */
              <div
                className="max-w-full max-h-full flex items-center justify-center my-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={effectiveFileUrl}
                  alt={currentDoc.label}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
                />
              </div>
            ) : viewMode === "vector" ? (
              /* 3. VECTOR SVG RENDERER (WITH EXPLICIT 800px WIDTH) */
              <div
                className="max-w-full max-h-full flex items-center justify-center my-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={svgPreviewUrl}
                  alt={currentDoc.label}
                  width={800}
                  height={docDetails.isLandscape ? 500 : 1050}
                  style={{ width: "800px", maxWidth: "100%", height: "auto" }}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
                />
              </div>
            ) : viewMode === "file" && isWord ? (
              /* 4. WORD / DOCX SPECIFICATION CARD & EXTRACTED TEXT VIEWER */
              <div className="max-w-2xl w-full rounded-2xl bg-card border p-6 shadow-xl space-y-4 my-auto">
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold truncate">{currentDoc.label}</h3>
                      <Badge variant="outline" className="text-[11px] border-blue-500/30 text-blue-600 bg-blue-50/50">
                        Saved in Database as Uploaded
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{currentDoc.fileName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border bg-muted/30 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Format:</span>
                    <span className="font-medium text-foreground">{formatLabel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">File Size:</span>
                    <span className="font-mono text-foreground">{(currentDoc.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Status:</span>
                    <span className="font-medium text-foreground">{DOCUMENT_STATUS_LABELS[currentDoc.status]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Database:</span>
                    <span className="font-medium text-emerald-600">Original Binary</span>
                  </div>
                </div>

                {/* Extracted Word Text Preview */}
                {loadingText ? (
                  <div className="rounded-xl border bg-background p-6 text-center text-xs text-muted-foreground">
                    <Clock className="mx-auto h-5 w-5 mb-2 animate-spin text-primary" />
                    Extracting document text for officer review...
                  </div>
                ) : extractedText ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Document Text Content Preview:</span>
                      <span className="text-[11px]">Unmodified Customer Upload</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-xl border bg-background p-4 text-xs font-serif leading-relaxed text-foreground whitespace-pre-wrap select-text shadow-inner">
                      {extractedText}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {effectiveFileUrl && (
                    <Button asChild className="flex-1 min-w-[200px]">
                      <a href={effectiveFileUrl} download={currentDoc.fileName}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Original File ({currentDoc.fileName.split(".").pop()?.toUpperCase()})
                      </a>
                    </Button>
                  )}
                  {effectiveFileUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(effectiveFileUrl, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </Button>
                  )}
                </div>
              </div>
            ) : viewMode === "file" && isText ? (
              /* 4B. PLAIN TEXT / CODE / CSV VIEWER */
              <div className="max-w-2xl w-full rounded-2xl bg-card border p-6 shadow-xl space-y-4 my-auto">
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold truncate">{currentDoc.label}</h3>
                    <p className="text-sm text-muted-foreground truncate">{currentDoc.fileName} • {formatLabel}</p>
                  </div>
                </div>

                {extractedText ? (
                  <div className="max-h-72 overflow-y-auto rounded-xl border bg-slate-950 p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap select-text shadow-inner">
                    {extractedText}
                  </div>
                ) : null}

                {effectiveFileUrl && (
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <a href={effectiveFileUrl} download={currentDoc.fileName}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Original File
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(effectiveFileUrl, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                )}
              </div>
            ) : viewMode === "file" && effectiveFileUrl ? (
              /* 4C. ANY OTHER FILE FORMAT UPLOADED BY CUSTOMER */
              <div className="max-w-xl w-full rounded-2xl bg-card border p-6 shadow-xl space-y-4 text-center my-auto">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentDoc.label}</h3>
                  <p className="text-sm text-muted-foreground">{currentDoc.fileName}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-xs text-left space-y-2">
                  <p>
                    <span className="text-muted-foreground">Original File Format:</span>{" "}
                    <strong>{formatLabel}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Database Storage:</span>{" "}
                    <span className="text-emerald-600 font-semibold">Saved in Database Exactly As Uploaded</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">File Size:</span>{" "}
                    {(currentDoc.fileSize / 1024).toFixed(1)} KB
                  </p>
                  <p>
                    <span className="text-muted-foreground">MIME Type:</span>{" "}
                    {currentDoc.mimeType || "application/octet-stream"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Current Review Status:</span>{" "}
                    {DOCUMENT_STATUS_LABELS[currentDoc.status]}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="flex-1">
                    <a href={effectiveFileUrl} download={currentDoc.fileName}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Original File for Review
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(effectiveFileUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>
            ) : (
              /* 5. HIGH-RESOLUTION INTERACTIVE PAPER DOCUMENT CANVAS (DEFAULT & FALLBACK) */
              <div
                className="w-full max-w-[760px] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 p-8 sm:p-12 space-y-6 my-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "top center",
                }}
              >
                {/* CORPORATE LETTERHEAD */}
                <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                  <h1 className="text-2xl font-bold font-serif tracking-tight text-slate-900 uppercase">
                    {docDetails.entityName}
                  </h1>
                  <p className="text-xs text-slate-600 font-mono">
                    CIN / Reg No: {docDetails.registrationNumber} &bull; Corporate PAN: {docDetails.pan}
                  </p>
                  <p className="text-xs text-slate-500">
                    Registered Office: {docDetails.address}
                  </p>
                </div>

                {/* DOCUMENT TITLE & METADATA BAR */}
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold font-serif text-slate-900 uppercase tracking-wide">
                    {docDetails.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {docDetails.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2 text-xs font-mono text-slate-700">
                  <span>Reference: <strong>{docDetails.referenceNumber}</strong></span>
                  <span>Execution Date: <strong>{docDetails.date}</strong></span>
                  <span className="text-emerald-700 font-bold">DIGITALLY VERIFIED</span>
                </div>

                {/* RESOLUTION / DECLARATION CLAUSES */}
                <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  {docDetails.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-justify font-normal">
                      {p}
                    </p>
                  ))}
                </div>

                {/* SIGNATURE & CORPORATE SEAL SECTION */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-900">
                      For and on behalf of {docDetails.entityName}:
                    </p>
                    {/* Simulated hand signature */}
                    <div className="pt-2">
                      <div className="h-10 w-44 border-b border-slate-400 flex items-center">
                        <span className="font-serif italic text-blue-700 text-lg font-bold select-none tracking-wider">
                          {docDetails.signatoryName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-900">
                        {docDetails.signatoryName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {docDetails.signatoryDesignation} (Authorized Signatory)
                      </p>
                    </div>
                  </div>

                  {/* Circular Official Seal */}
                  <div className="flex justify-end">
                    <div className="h-28 w-28 rounded-full border-2 border-dashed border-emerald-700 flex flex-col items-center justify-center text-center p-2 text-emerald-800 rotate-[-8deg] select-none shadow-xs bg-emerald-50/50">
                      <p className="text-[9px] font-bold tracking-tighter truncate max-w-[90px]">
                        {docDetails.entityName.toUpperCase()}
                      </p>
                      <p className="text-[8px] font-extrabold tracking-wider my-0.5">
                        ★ OFFICIAL SEAL ★
                      </p>
                      <p className="text-[8px] font-semibold">AUTHORIZED</p>
                    </div>
                  </div>
                </div>

                {/* BOTTOM REGULATORY VERIFICATION BANNER */}
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center text-xs text-emerald-800 font-medium">
                  ✓ Formally Executed Document Filed in Pixelonics Compliance Records for Officer Review
                </div>
              </div>
            )}
          </div>

          {/* RIGHT / BOTTOM REVIEW PANEL */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-card flex flex-col justify-between p-5 space-y-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">Officer Verification</p>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Carefully review entity names, registration identifiers, signatures, and compliance seals.
                </p>
              </div>

              {/* STATUS INDICATOR */}
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Review Status</span>
                  <Badge className={statusBadgeVariant(currentDoc.status)}>
                    {DOCUMENT_STATUS_LABELS[currentDoc.status]}
                  </Badge>
                </div>
                {currentDoc.status === "verified_demo" ? (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified by Compliance Officer
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Officer Verification
                  </p>
                )}
              </div>

              {/* REVIEWER NOTES */}
              {isOfficer && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Officer Compliance Notes
                  </label>
                  <Textarea
                    placeholder="Enter verification notes, check details, or specific reasons for replacement..."
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    rows={4}
                    className="text-xs resize-none"
                  />
                </div>
              )}

              {/* VERSION HISTORY ACCORDION */}
              {currentDoc.history && currentDoc.history.length > 1 && (
                <div className="border rounded-lg p-2.5 space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex w-full items-center justify-between font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span>Version History ({currentDoc.history.length})</span>
                    <span className="text-[10px]">{showHistory ? "Hide" : "Show"}</span>
                  </button>
                  {showHistory && (
                    <div className="space-y-1 pt-1.5 border-t border-border/40">
                      {currentDoc.history.map((ver) => (
                        <div key={ver.version} className="flex justify-between text-[11px] py-0.5">
                          <span>
                            v{ver.version} • {ver.fileName}
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(ver.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {isOfficer && (
              <div className="space-y-2 pt-2 border-t">
                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  onClick={handleVerify}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Verify Document
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-amber-600 hover:text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs"
                    onClick={handleRequestReplacement}
                  >
                    <AlertCircle className="mr-1 h-3.5 w-3.5" />
                    Request Replace
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-rose-600 hover:text-rose-700 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs"
                    onClick={() => {
                      const notes = reviewerNotes.trim() || "Rejected by Compliance Officer";
                      onReject?.(currentDoc.id, notes);
                      toast.error(`Rejected document: ${currentDoc.label}`);
                    }}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
