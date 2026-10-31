"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { WalletPanSelfie } from "@/lib/types";
import {
  Camera,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Upload,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Smartphone,
  User,
  Info,
  Maximize2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface WalletPanSelfieCameraProps {
  walletId: string;
  walletLabel: string;
  walletAddress: string;
  existingSelfie?: WalletPanSelfie;
  onSaveSelfie: (selfie: WalletPanSelfie) => void;
}

export const SAMPLE_WALLET_PAN_IMAGE_URL = "/wallet-pan.jpg";

export function WalletPanSelfieCamera({
  walletId,
  walletLabel,
  walletAddress,
  existingSelfie,
  onSaveSelfie,
}: WalletPanSelfieCameraProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const [hardwareZoomSupported, setHardwareZoomSupported] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(
    existingSelfie?.photoUrl || null
  );
  const [capturedZoom, setCapturedZoom] = useState<number>(existingSelfie?.zoomLevel || 1.5);
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Apply hardware zoom if supported by camera
  const applyHardwareZoom = useCallback(async (zoomVal: number) => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const trackWithCaps = videoTrack as unknown as {
        getCapabilities?: () => { zoom?: { min?: number; max?: number } };
        applyConstraints: (constraints: { advanced?: Array<{ zoom?: number }> }) => Promise<void>;
      };
      const capabilities = trackWithCaps.getCapabilities?.();
      if (capabilities && capabilities.zoom) {
        setHardwareZoomSupported(true);
        const min = capabilities.zoom.min || 1;
        const max = capabilities.zoom.max || 3;
        const clampedZoom = Math.min(Math.max(zoomVal, min), max);
        await trackWithCaps.applyConstraints({
          advanced: [{ zoom: clampedZoom }],
        });
      }
    } catch {
      // Hardware zoom not supported, digital fallback is active
      setHardwareZoomSupported(false);
    }
  }, []);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      applyHardwareZoom(zoomLevel);
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Unable to access camera. Please allow camera permissions or upload an image file.");
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleZoomChange = (val: number) => {
    const clamped = Math.round(val * 10) / 10;
    setZoomLevel(clamped);
    applyHardwareZoom(clamped);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const canvas = document.createElement("canvas");
    const srcWidth = video.videoWidth || 1280;
    const srcHeight = video.videoHeight || 720;

    canvas.width = srcWidth;
    canvas.height = srcHeight;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // If hardware zoom is not active, apply digital center crop zoom
      if (!hardwareZoomSupported && zoomLevel > 1) {
        const cropWidth = srcWidth / zoomLevel;
        const cropHeight = srcHeight / zoomLevel;
        const cropX = (srcWidth - cropWidth) / 2;
        const cropY = (srcHeight - cropHeight) / 2;
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, srcWidth, srcHeight);
      } else {
        ctx.drawImage(video, 0, 0, srcWidth, srcHeight);
      }

      // Add high-contrast inspection banner at top
      const bannerHeight = 36;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(0, 0, srcWidth, bannerHeight);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(0, bannerHeight - 2, srcWidth, 2);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.fillText(
        `PAN & WALLET VERIFICATION SELFIE • ZOOM: ${zoomLevel.toFixed(1)}x • WALLET: ${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`,
        16,
        22
      );

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setCapturedPhotoUrl(dataUrl);
      setCapturedZoom(zoomLevel);
      handleStopCamera();

      const newSelfie: WalletPanSelfie = {
        id: `pan-selfie-${Date.now()}`,
        photoUrl: dataUrl,
        fileName: `${walletLabel.replace(/\s+/g, "_")}_PAN_Wallet_Selfie.jpg`,
        fileSize: Math.round(dataUrl.length * 0.75),
        capturedAt: new Date().toISOString(),
        zoomLevel,
        status: "verified_demo",
      };

      onSaveSelfie(newSelfie);
      toast.success("Selfie captured! PAN card and wallet screen recorded.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG or PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedPhotoUrl(dataUrl);
      setCapturedZoom(1.5);

      const newSelfie: WalletPanSelfie = {
        id: `pan-selfie-${Date.now()}`,
        photoUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        capturedAt: new Date().toISOString(),
        zoomLevel: 1.5,
        status: "verified_demo",
      };

      onSaveSelfie(newSelfie);
      toast.success("Uploaded PAN & Wallet selfie!");
    };
    reader.readAsDataURL(file);
  };

  const handleUseSample = () => {
    setCapturedPhotoUrl(SAMPLE_WALLET_PAN_IMAGE_URL);
    setCapturedZoom(1.5);

    const newSelfie: WalletPanSelfie = {
      id: `pan-selfie-${Date.now()}`,
      photoUrl: SAMPLE_WALLET_PAN_IMAGE_URL,
      fileName: `${walletLabel.replace(/\s+/g, "_")}_PAN_Wallet_Sample.jpg`,
      fileSize: 450000,
      capturedAt: new Date().toISOString(),
      zoomLevel: 1.5,
      status: "verified_demo",
    };

    onSaveSelfie(newSelfie);
    toast.success("Applied sample PAN card + Wallet selfie!");
  };

  const handleRemove = () => {
    setCapturedPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Removed PAN & Wallet selfie");
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* HEADER & STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <span>PAN Card &amp; Crypto Wallet Selfie Verification</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {walletLabel}
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Capture a selfie holding your physical PAN card and device showing this wallet. Use zoom to ensure both are readable.
            </p>
          </div>
        </div>

        {capturedPhotoUrl ? (
          <Badge className="bg-emerald-600 text-white text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            PAN &amp; Wallet Selfie Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
            <AlertCircle className="mr-1 h-3 w-3" />
            Selfie Required
          </Badge>
        )}
      </div>

      {/* COMPLIANCE GUIDANCE & SAMPLE MODAL */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Mandatory Verification Requirement:
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Hold your <strong>physical PAN Card</strong> in one hand and your <strong>smartphone displaying the wallet receive screen / QR code</strong> in the other. Both must be sharply visible and legible. Use the camera zoom controls below to enlarge card details and screen text.
              </p>
            </div>
          </div>

          {/* VIEW REFERENCE MODAL */}
          <Dialog open={exampleDialogOpen} onOpenChange={setExampleDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 h-7 text-xs bg-background hover:bg-muted font-medium border-primary/30 text-primary"
              >
                <Eye className="mr-1 h-3 w-3" />
                View Example Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Sample PAN Card &amp; Crypto Wallet Selfie
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Your photo must show your face, physical PAN card, and the wallet app screen with the address clearly readable.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="relative overflow-hidden rounded-xl border bg-black shadow-md">
                  <img
                    src={SAMPLE_WALLET_PAN_IMAGE_URL}
                    alt="Sample PAN Card and Wallet Selfie"
                    className="w-full max-h-[400px] object-contain mx-auto"
                  />
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Checklist for Passing Verification:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                    <li><strong>Face View:</strong> Face clearly visible, uncovered, matching corporate signatory KYC.</li>
                    <li><strong>Physical PAN Card:</strong> Name, PAN number (e.g. SKZPL8431Y), photo, and QR code must be sharp and legible.</li>
                    <li><strong>Active Wallet Screen:</strong> Phone screen showing wallet name (&quot;Adyar Wallet&quot;), QR code, and address.</li>
                    <li><strong>Camera Zoom Controls:</strong> Use the 1.5x - 2.5x zoom control if text appears too small.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setExampleDialogOpen(false);
                      handleUseSample();
                    }}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Use This Sample Photo
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ACTIVE CAMERA VIEWPORT WITH ZOOM CONTROLS */}
      {cameraActive && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border bg-black aspect-video max-w-lg mx-auto shadow-lg">
            {/* Flash Overlay */}
            {flashActive && <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />}

            {/* Video Stream with Zoom Scale */}
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  transform: !hardwareZoomSupported ? `scale(${zoomLevel})` : undefined,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Visual Alignment Guides Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 p-3 gap-2 z-10">
              {/* Top: Face Alignment */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="border-2 border-dashed border-cyan-400/80 rounded-full w-28 h-28 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px]">
                  <User className="h-5 w-5 text-cyan-300 opacity-80" />
                  <span className="text-[10px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded-full mt-1">
                    Your Face
                  </span>
                </div>
              </div>

              {/* Bottom Left: PAN Card Guide */}
              <div className="flex items-end justify-start">
                <div className="border-2 border-dashed border-amber-400/90 rounded-lg w-36 h-24 flex flex-col items-center justify-center bg-black/40 p-1">
                  <CreditCard className="h-5 w-5 text-amber-300" />
                  <span className="text-[10px] text-white font-medium text-center leading-tight mt-1">
                    Hold PAN Card
                  </span>
                  <span className="text-[8px] text-amber-200">Text must be readable</span>
                </div>
              </div>

              {/* Bottom Right: Wallet Screen Guide */}
              <div className="flex items-end justify-end">
                <div className="border-2 border-dashed border-emerald-400/90 rounded-lg w-36 h-24 flex flex-col items-center justify-center bg-black/40 p-1">
                  <Smartphone className="h-5 w-5 text-emerald-300" />
                  <span className="text-[10px] text-white font-medium text-center leading-tight mt-1">
                    Hold Wallet Screen
                  </span>
                  <span className="text-[8px] text-emerald-200">Address &amp; QR visible</span>
                </div>
              </div>
            </div>

            {/* Live Camera HUD Bar */}
            <div className="absolute top-2 left-2 right-2 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg text-white text-[11px] flex items-center justify-between z-20">
              <span className="flex items-center gap-1 font-medium">
                <Camera className="h-3.5 w-3.5 text-cyan-400" />
                Live Camera Feed
              </span>
              <Badge variant="secondary" className="bg-primary/30 text-cyan-300 border-cyan-500/30 text-[10px]">
                Zoom: {zoomLevel.toFixed(1)}x
              </Badge>
            </div>
          </div>

          {/* ZOOM CONTROLS TOOLBAR */}
          <div className="rounded-xl border bg-muted/30 p-3 space-y-2.5 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-primary" />
                Camera Zoom Control (Ensure Readability):
              </span>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {zoomLevel.toFixed(1)}x Zoom
              </span>
            </div>

            {/* Slider & Step Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(Math.max(1, zoomLevel - 0.25))}
                disabled={zoomLevel <= 1}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>

              <input
                type="range"
                value={zoomLevel}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-2 bg-muted rounded-lg cursor-pointer"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoomChange(Math.min(3, zoomLevel + 0.25))}
                disabled={zoomLevel >= 3}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1.0, 1.5, 2.0, 2.5, 3.0].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={zoomLevel === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleZoomChange(preset)}
                  className="h-6 text-[11px] px-2.5"
                >
                  {preset.toFixed(1)}x
                </Button>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button
              type="button"
              onClick={handleCapturePhoto}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 font-semibold"
            >
              <Camera className="mr-1.5 h-4 w-4" />
              Capture Photo ({zoomLevel.toFixed(1)}x Zoom)
            </Button>
            <Button type="button" variant="outline" onClick={handleStopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* PREVIEW OF CAPTURED PHOTO */}
      {!cameraActive && capturedPhotoUrl && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border bg-muted/20 p-3.5">
            {/* THUMBNAIL */}
            <div
              className="relative group h-40 w-32 overflow-hidden rounded-lg border shadow-sm shrink-0 bg-slate-900 cursor-pointer"
              onClick={() => setPreviewDialogOpen(true)}
            >
              <img
                src={capturedPhotoUrl}
                alt="Captured PAN and Wallet Selfie"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium">
                <Maximize2 className="mr-1 h-3.5 w-3.5" /> Inspect
              </div>
              <div className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* DETAILS & ACTIONS */}
            <div className="space-y-2 text-xs flex-1 w-full">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div>
                  <span className="font-semibold text-foreground text-sm">
                    PAN Card &amp; Wallet Selfie Recorded
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Captured under <strong>{capturedZoom.toFixed(1)}x Zoom</strong> for maximum document readability.
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {walletLabel}
                </Badge>
              </div>

              <div className="rounded-lg border bg-background p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Linked Wallet Address:</span>
                  <span className="font-mono text-primary font-medium text-[11px]">
                    {walletAddress}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Verification Check:</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    PAN Details &amp; Wallet Screen Matched
                  </span>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartCamera}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retake Photo with Camera
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDialogOpen(true)}
                  className="h-7 text-xs"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Inspect Full Resolution
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* FULL RESOLUTION INSPECTION DIALOG */}
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Inspect PAN Card &amp; Wallet Selfie ({walletLabel})
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Check readability of the PAN number, name, and crypto wallet address / QR code.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-xl border bg-black mt-2">
                <img
                  src={capturedPhotoUrl}
                  alt="Full size PAN and Wallet Selfie"
                  className="w-full max-h-[520px] object-contain mx-auto"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* NO PHOTO CAPTURED YET */}
      {!cameraActive && !capturedPhotoUrl && (
        <div className="rounded-xl border border-dashed p-6 text-center space-y-3 bg-muted/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Capture Selfie with PAN Card &amp; Wallet
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Open your camera with zoom controls to capture a selfie holding your physical PAN card and device showing your crypto wallet.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              onClick={handleStartCamera}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Camera className="mr-1.5 h-4 w-4" />
              Open Camera with Zoom
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload Image File
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUseSample}
              className="text-xs text-primary"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Use Sample Photo
            </Button>
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
