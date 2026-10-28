"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from "@/lib/config/document-requirements";
import { DOCUMENT_STATUS_LABELS } from "@/lib/constants/labels";
import type { ApplicationDocument } from "@/lib/types";
import { cn } from "cn";
import { toast } from "sonner";

function isImageFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith("image/")) return true;
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
}

function buildFallbackSvgPreview(label: string, fileName: string): string {
  const safeLabel = label.replace(/[<>&"']/g, "");
  const safeFile = fileName.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <rect width="640" height="360" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="28" y="28" width="584" height="56" rx="8" fill="#0f172a"/>
    <text x="48" y="62" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${safeLabel}</text>
    <rect x="480" y="42" width="112" height="28" rx="14" fill="#1e293b"/>
    <text x="536" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#38bdf8">KYC DOCUMENT</text>
    <rect x="44" y="112" width="140" height="160" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-dasharray="4 4"/>
    <circle cx="114" cy="170" r="26" fill="#94a3b8"/>
    <path d="M74 244 C74 214 154 214 154 244" fill="#94a3b8"/>
    <text x="212" y="138" font-family="Arial, sans-serif" font-size="13" fill="#64748b">FILE NAME</text>
    <text x="212" y="160" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${safeFile}</text>
    <text x="212" y="200" font-family="Arial, sans-serif" font-size="13" fill="#64748b">VERIFICATION STATUS</text>
    <text x="212" y="222" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">Uploaded &amp; Attached to Application</text>
    <line x1="212" y1="248" x2="580" y2="248" stroke="#e2e8f0" stroke-width="2"/>
    <text x="212" y="272" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Pixelonics × Pandosoft Compliance Record</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function DocumentUploader({
  onUpload,
  label,
  description,
  maxSizeMb = 10,
  existingDocument,
  required = true,
  conditionLabel,
}: {
  onUpload?: (file: File) => void;
  label: string;
  description?: string;
  maxSizeMb?: number;
  existingDocument?: ApplicationDocument;
  required?: boolean;
  conditionLabel?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImgFailed(false);
  }, [existingDocument?.previewUrl, existingDocument?.fileName, localPreviewUrl]);

  const validateFile = (f: File) => {
    if (
      !ACCEPTED_MIME_TYPES.includes(f.type as (typeof ACCEPTED_MIME_TYPES)[number]) &&
      !ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    ) {
      setError("Only PDF, JPEG, and PNG files are accepted");
      toast.error("Only PDF, JPEG, and PNG files are accepted");
      return false;
    }
    if (f.size > maxSizeMb * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMb}MB`);
      toast.error(`File size must be less than ${maxSizeMb}MB`);
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = (f: File) => {
    if (validateFile(f)) {
      setFile(f);
      setImgFailed(false);
      setShowPreview(true);

      // Generate immediate Data URL preview so the uploaded image is visible right away
      if (isImageFile(f.name, f.type)) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              setLocalPreviewUrl(reader.result);
            }
          };
          reader.readAsDataURL(f);
        } catch {
          try {
            setLocalPreviewUrl(URL.createObjectURL(f));
          } catch {
            setLocalPreviewUrl(null);
          }
        }
      } else {
        try {
          setLocalPreviewUrl(URL.createObjectURL(f));
        } catch {
          setLocalPreviewUrl(null);
        }
      }

      onUpload?.(f);
      toast.success(`Uploaded ${f.name}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const activeName = file?.name ?? existingDocument?.fileName;
  const activeMime = file?.type ?? existingDocument?.mimeType;
  const activeSize = file?.size ?? existingDocument?.fileSize ?? 0;
  const activeStatus = existingDocument?.status ?? (file ? "ready_for_review" : undefined);

  const isImage = isImageFile(activeName, activeMime);
  const rawPreviewUrl = localPreviewUrl ?? existingDocument?.previewUrl;
  const displayImageUrl =
    isImage && activeName
      ? !imgFailed && rawPreviewUrl
        ? rawPreviewUrl
        : buildFallbackSvgPreview(label, activeName)
      : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{label}</p>
              {required ? (
                <Badge variant="outline" className="text-[11px]">
                  Required
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px]">
                  Optional
                </Badge>
              )}
              {conditionLabel && (
                <span className="text-xs text-muted-foreground">({conditionLabel})</span>
              )}
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {activeStatus && (
            <Badge
              variant="outline"
              className={cn(
                activeStatus === "verified_demo" && "border-success/30 bg-success-soft text-success",
                activeStatus === "ready_for_review" && "border-info/30 bg-info-soft text-info",
                (activeStatus === "rejected_demo" || activeStatus === "replacement_required") &&
                  "border-danger/30 bg-danger-soft text-danger"
              )}
            >
              {DOCUMENT_STATUS_LABELS[activeStatus]}
            </Badge>
          )}
        </div>

        {!activeName ? (
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-border"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF, JPEG, PNG (max {maxSizeMb}MB)</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => inputRef.current?.click()}
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                {displayImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-background"
                    title="Click to enlarge image"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImageUrl}
                      alt={activeName}
                      onError={() => setImgFailed(true)}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </button>
                ) : activeStatus === "verified_demo" ? (
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-success" />
                ) : (
                  <FileText className="h-7 w-7 shrink-0 text-primary" />
                )}
                <div>
                  <p className="text-sm font-medium">{activeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(activeSize / 1024).toFixed(1)} KB
                    {existingDocument?.version ? ` • v${existingDocument.version}` : ""}
                  </p>
                  {existingDocument?.reviewerNotes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Note: {existingDocument.reviewerNotes}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {displayImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview((prev) => !prev)}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                        Hide Image
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Show Image
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Replace
                </Button>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setLocalPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {displayImageUrl && showPreview && (
              <div className="overflow-hidden rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    Uploaded Image Preview — {activeName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <Maximize2 className="mr-1 h-3 w-3" />
                    Full Size
                  </Button>
                </div>
                <div className="flex justify-center rounded-md border bg-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImageUrl}
                    alt={`Preview of ${activeName}`}
                    onError={() => setImgFailed(true)}
                    onClick={() => setLightboxOpen(true)}
                    className="max-h-72 w-auto cursor-zoom-in rounded object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {lightboxOpen && displayImageUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-xl border bg-background p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-4 border-b pb-2">
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{activeName}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Close
                </Button>
              </div>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImageUrl}
                  alt={activeName}
                  className="max-h-[75vh] w-auto rounded object-contain"
                />
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
