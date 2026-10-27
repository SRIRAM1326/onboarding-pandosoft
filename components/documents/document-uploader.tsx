"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from "@/lib/config/document-requirements";
import { cn } from "cn";

export function DocumentUploader({
  onUpload,
  label,
  description,
  maxSizeMb = 10,
}: {
  onUpload?: (file: File) => void;
  label: string;
  description?: string;
  maxSizeMb?: number;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File) => {
    if (!ACCEPTED_MIME_TYPES.includes(f.type as any) && !ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      setError("Only PDF, JPEG, and PNG files are accepted");
      return false;
    }
    if (f.size > maxSizeMb * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMb}MB`);
      return false;
    }
    setError("");
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (validateFile(f)) {
        setFile(f);
        onUpload?.(f);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (validateFile(f)) {
        setFile(f);
        onUpload?.(f);
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2">
          <p className="font-medium">{label}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {!file ? (
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-border"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
            <p className="text-xs text-muted-foreground">PDF, JPEG, PNG (max {maxSizeMb}MB)</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
              Choose File
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
