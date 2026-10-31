"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VIDEO_KYC_STATUS_LABELS } from "@/lib/constants/labels";
import type { Application } from "@/lib/types";
import {
  Video,
  Upload,
  CircleDot,
  Square,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Database,
  FileVideo,
  Camera,
  Users,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const RAW_VIDEO_KYC_TEMPLATE = `My name is [Full Name], authorized representative of [Your Company Name], completing the Video KYC on [Date] for our Pandosoft trading account on behalf of the Board of Directors ([Names of Directors]) and Ultimate Beneficial Owners ([Names of UBOs]). The Company PAN is [Company PAN], my PAN is [Personal PAN], and the registered email is [Email ID]. This is my wallet ID: [Wallet ID Number]. 
I confirm that I am duly authorized to operate this account as per the Board Resolution / Authorization Letter. We are the rightful owners of this account, and all funds used are from legitimate and lawful sources. These funds are not customer funds, borrowed funds, or pooled public money. Withdrawals are made only to verified, self-owned wallets, and we indemnify Pandosoft against any false declarations made by us.`;

export function buildPrefilledVideoKycScript(app: Application): string {
  const fullName = app.signatory.fullName?.trim() || "[Full Name]";
  const companyName = app.business.legalName?.trim() || "[Your Company Name]";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const companyPan = app.business.pan?.trim() || "[Company PAN]";
  const personalPan = app.signatory.pan?.trim() || "[Personal PAN]";
  const emailId = app.signatory.email?.trim() || app.business.email?.trim() || "[Email ID]";
  const walletId = app.wallets[0]?.address?.trim() || "[Wallet ID Number]";

  const directorNames = (app.directors || [])
    .map((d) => d.fullName?.trim())
    .filter(Boolean);
  const uboNames = (app.beneficialOwners || [])
    .map((u) => u.fullName?.trim())
    .filter(Boolean);

  const directorsSummary =
    directorNames.length > 0 ? directorNames.join(", ") : "all appointed directors";
  const ubosSummary =
    uboNames.length > 0 ? uboNames.join(", ") : "all beneficial owners";

  return `My name is ${fullName}, authorized representative of ${companyName}, completing the Video KYC on ${dateStr} for our Pandosoft trading account on behalf of the Board of Directors (${directorsSummary}) and Ultimate Beneficial Owners (${ubosSummary}). The Company PAN is ${companyPan}, my PAN is ${personalPan}, and the registered email is ${emailId}. This is my wallet ID: ${walletId}. 
I confirm that I am duly authorized to operate this account as per the Board Resolution / Authorization Letter. We are the rightful owners of this account, and all funds used are from legitimate and lawful sources. These funds are not customer funds, borrowed funds, or pooled public money. Withdrawals are made only to verified, self-owned wallets, and we indemnify Pandosoft against any false declarations made by us.`;
}

interface VideoKycRecorderProps {
  app: Application;
  onUploadVideo: (file: File, spokenScript: string) => Promise<{ videoUrl: string }>;
}

export function VideoKycRecorder({
  app,
  onUploadVideo,
}: VideoKycRecorderProps) {
  const [showPrefilled, setShowPrefilled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Camera & Recording state
  const [cameraActive, setCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const prefilledScript = buildPrefilledVideoKycScript(app);
  const displayedScript = showPrefilled ? prefilledScript : RAW_VIDEO_KYC_TEMPLATE;

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
      }
    };
  }, [recordedPreviewUrl]);

  const stopCameraTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
  };

  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setCameraActive(true);
      setRecordedBlob(null);
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(null);
      }
      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      });
    } catch {
      toast.error(
        "Could not access camera or microphone. Please allow camera/mic permissions or upload a recorded video file."
      );
    }
  };

  const handleStartRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    const supportedType = mimeTypes.find((t) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
    );

    const recorder = supportedType
      ? new MediaRecorder(stream, { mimeType: supportedType })
      : new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedPreviewUrl(url);
      stopCameraTracks();
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
    setRecordingSeconds(0);
    setIsRecording(true);
    toast.info("Recording started — please read the declaration script aloud clearly.");
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSaveRecordedVideo = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const fileName = `Video_KYC_${app.reference.replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;
      const file = new File([recordedBlob], fileName, {
        type: recordedBlob.type || "video/webm",
      });
      await onUploadVideo(file, prefilledScript);
      setRecordedBlob(null);
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(null);
      }
      toast.success("Video KYC recording uploaded and saved to database!");
    } catch {
      toast.error("Failed to save Video KYC recording");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/") && !/\.(mp4|webm|mov|mkv)$/i.test(selected.name)) {
      toast.error("Please select a valid video file (.mp4, .webm, .mov)");
      return;
    }
    setIsUploading(true);
    try {
      await onUploadVideo(selected, prefilledScript);
      toast.success(`Uploaded "${selected.name}" and saved to database!`);
    } catch {
      toast.error("Failed to upload video file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(displayedScript);
      setCopied(true);
      toast.success("Video KYC script copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy script");
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold">Video KYC Declaration &amp; Recording</p>
          <p className="text-xs text-muted-foreground">
            Record or upload your Video KYC reading the mandatory declaration script below. Your video is saved directly to the compliance database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={app.videoKyc.status === "completed" ? "default" : "outline"}>
            {VIDEO_KYC_STATUS_LABELS[app.videoKyc.status]}
          </Badge>
          {app.videoKyc.videoUrl && (
            <Badge className="bg-success text-white hover:bg-success/90">
              <Database className="mr-1 h-3 w-3" />
              Saved in Database
            </Badge>
          )}
        </div>
      </div>

      {/* DIRECTORS & BENEFICIAL OWNERS (UBOS) COVERED */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-xs uppercase tracking-wider text-foreground">
              Directors &amp; Beneficial Owners (UBOs) Covered Under This Video KYC
            </span>
          </div>
          <Badge variant="outline" className="text-xs bg-background">
            Single Master KYC Session (Authorized Signatory)
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border bg-background p-3 space-y-1.5 shadow-2xs">
            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Board of Directors ({(app.directors || []).length})
            </p>
            {(app.directors || []).length > 0 ? (
              <ul className="space-y-1.5">
                {(app.directors || []).map((dir) => (
                  <li key={dir.id} className="flex items-center justify-between font-medium text-foreground">
                    <span>{dir.fullName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({dir.designation}{dir.identificationNumber ? ` • DIN: ${dir.identificationNumber}` : ""})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">Listed under company registration</p>
            )}
          </div>

          <div className="rounded-lg border bg-background p-3 space-y-1.5 shadow-2xs">
            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              Ultimate Beneficial Owners ({(app.beneficialOwners || []).length})
            </p>
            {(app.beneficialOwners || []).length > 0 ? (
              <ul className="space-y-1.5">
                {(app.beneficialOwners || []).map((ubo) => (
                  <li key={ubo.id} className="flex items-center justify-between font-medium text-foreground">
                    <span>{ubo.fullName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      ({ubo.ownershipPercentage}% Ownership • {ubo.role})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground italic">Listed under beneficial ownership</p>
            )}
          </div>
        </div>
      </div>

      {/* 1. SPOKEN TEMPLATE SCRIPT */}
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Mandatory Spoken Script
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">
              Read this script aloud clearly while recording your Video KYC
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowPrefilled((v) => !v)}
            >
              {showPrefilled ? "Show Blank Template" : "Auto-fill My Details"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCopyScript}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  Copy Script
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4 text-sm leading-relaxed text-foreground shadow-xs space-y-3">
          <p className="font-medium">
            &ldquo;My name is{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {showPrefilled ? app.signatory.fullName?.trim() || "[Full Name]" : "[Full Name]"}
            </span>
            , authorized representative of{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {showPrefilled
                ? app.business.legalName?.trim() || "[Your Company Name]"
                : "[Your Company Name]"}
            </span>
            , completing the Video KYC on{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {showPrefilled
                ? new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "[Date]"}
            </span>{" "}
            for our Pandosoft trading account. The Company PAN is{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary">
              {showPrefilled ? app.business.pan?.trim() || "[Company PAN]" : "[Company PAN]"}
            </span>
            , my PAN is{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono font-semibold text-primary">
              {showPrefilled ? app.signatory.pan?.trim() || "[Personal PAN]" : "[Personal PAN]"}
            </span>
            , and the registered email is{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
              {showPrefilled
                ? app.signatory.email?.trim() || app.business.email?.trim() || "[Email ID]"
                : "[Email ID]"}
            </span>
            . This is my wallet ID:{" "}
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary break-all">
              {showPrefilled
                ? app.wallets[0]?.address?.trim() || "[Wallet ID Number]"
                : "[Wallet ID Number]"}
            </span>
            .
          </p>
          <p className="font-medium">
            I confirm that I am duly authorized to operate this account as per the Board Resolution /
            Authorization Letter. We are the rightful owners of this account, and all funds used are
            from legitimate and lawful sources. These funds are not customer funds, borrowed funds,
            or pooled public money. Withdrawals are made only to verified, self-owned wallets, and we
            indemnify Pandosoft against any false declarations made by us.&rdquo;
          </p>
        </div>
      </div>

      {/* 2. CUSTOMER VIDEO RECORDER / UPLOADER */}
      <div>
        {/* Customer Take Video / Upload Video Card */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Your Video KYC Submission</p>
            </div>
            {isUploading && <Badge variant="outline">Saving to Database...</Badge>}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/*"
            capture="user"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Live Camera Recording View */}
          {cameraActive && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg border bg-black">
                <video
                  ref={liveVideoRef}
                  muted
                  playsInline
                  autoPlay
                  className="aspect-video w-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-white shadow">
                    <span className="h-2 w-2 animate-ping rounded-full bg-white" />
                    REC {formatTimer(recordingSeconds)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!isRecording ? (
                  <Button type="button" size="sm" onClick={handleStartRecording}>
                    <CircleDot className="mr-1.5 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleStopRecording}
                  >
                    <Square className="mr-1.5 h-4 w-4" />
                    Stop Recording ({formatTimer(recordingSeconds)})
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={stopCameraTracks}>
                  Cancel Camera
                </Button>
              </div>
            </div>
          )}

          {/* Recorded Video Preview (Before Saving) */}
          {!cameraActive && recordedPreviewUrl && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-primary">
                Preview your recorded Video KYC before saving to the database:
              </p>
              <div className="overflow-hidden rounded-lg border bg-black">
                <video
                  controls
                  src={recordedPreviewUrl}
                  className="aspect-video w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleSaveRecordedVideo}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {isUploading ? "Saving to Database..." : "Save & Upload Video to Database"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={handleOpenCamera}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Retake Video
                </Button>
              </div>
            </div>
          )}

          {/* Already Uploaded & Saved Video Preview */}
          {!cameraActive && !recordedPreviewUrl && app.videoKyc.videoUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border bg-black">
                <video
                  key={app.videoKyc.videoUrl}
                  controls
                  preload="none"
                  style={{ width: "100%", maxHeight: "260px" }}
                  className="aspect-video w-full object-contain"
                  src={app.videoKyc.videoUrl}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileVideo className="h-4 w-4 shrink-0 text-primary" />
                  <div className="truncate">
                    <p className="font-medium truncate">
                      {app.videoKyc.fileName || "Video_KYC_Recording.mp4"}
                    </p>
                    <p className="text-muted-foreground">
                      {app.videoKyc.fileSize
                        ? `${(app.videoKyc.fileSize / (1024 * 1024)).toFixed(2)} MB • `
                        : ""}
                      {app.videoKyc.uploadedAt
                        ? `Saved ${new Date(app.videoKyc.uploadedAt).toLocaleString()}`
                        : "Saved in database"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Verified Upload
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons to Record or Upload */}
          {!cameraActive && (
            <div className="space-y-3 pt-1">
              {!app.videoKyc.videoUrl && !recordedPreviewUrl && (
                <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                  <Video className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Take a Video with Your Camera or Upload a Video File
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Record yourself reading the declaration script above, or upload an MP4/WebM/MOV video file.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isUploading}
                  onClick={handleOpenCamera}
                >
                  <Camera className="mr-1.5 h-4 w-4" />
                  {app.videoKyc.videoUrl ? "Record New Video" : "Take Video with Camera"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  {app.videoKyc.videoUrl ? "Replace Uploaded Video" : "Upload Video File"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
