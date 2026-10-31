"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GeoLocationTag, IndividualSelfie } from "@/lib/types";
import {
  Upload,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  FileImage,
  Sparkles,
  Info,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface GeoSelfieRecorderProps {
  personName: string;
  personRole: string; // e.g. "Director" or "Beneficial Owner (65%)"
  existingSelfie?: IndividualSelfie;
  onSaveSelfie: (selfie: IndividualSelfie) => void;
}

export const SAMPLE_GEO_IMAGE_URL = "/geo-image.jpg";
export const SAMPLE_GEO_DATA: GeoLocationTag = {
  latitude: 13.0063,
  longitude: 80.2574,
  accuracy: 5,
  timestamp: new Date().toISOString(),
  addressString: "No 15, Gandhi Nagar 1st Main Road, Adyar, Chennai, Tamil Nadu 600020, India",
};

export function GeoSelfieRecorder({
  personName,
  personRole,
  existingSelfie,
  onSaveSelfie,
}: GeoSelfieRecorderProps) {
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(
    existingSelfie?.photoUrl || null
  );
  const [fileName, setFileName] = useState<string>(
    existingSelfie?.fileName || "Geo_Tagged_Photo.jpg"
  );
  const [fileSize, setFileSize] = useState<number>(existingSelfie?.fileSize || 0);
  const [geoTag, setGeoTag] = useState<GeoLocationTag | null>(
    existingSelfie?.geoLocation || null
  );
  const [isEditingGeo, setIsEditingGeo] = useState(false);
  const [tempLat, setTempLat] = useState<string>(
    existingSelfie?.geoLocation?.latitude?.toString() || "13.0063"
  );
  const [tempLng, setTempLng] = useState<string>(
    existingSelfie?.geoLocation?.longitude?.toString() || "80.2574"
  );
  const [tempAddress, setTempAddress] = useState<string>(
    existingSelfie?.geoLocation?.addressString ||
      "No 15, Gandhi Nagar 1st Main Road, Adyar, Chennai, Tamil Nadu 600020, India"
  );

  const [isDragging, setIsDragging] = useState(false);
  const [exampleDialogOpen, setExampleDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/") && !/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      toast.error("Please select a valid image file (JPG, PNG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedPhotoUrl(dataUrl);
      setFileName(file.name);
      setFileSize(file.size);

      // Default or preserve geo-tag metadata
      const assignedGeo: GeoLocationTag = geoTag || {
        latitude: parseFloat(tempLat) || 13.0063,
        longitude: parseFloat(tempLng) || 80.2574,
        accuracy: 5,
        timestamp: new Date().toISOString(),
        addressString: tempAddress,
      };
      setGeoTag(assignedGeo);

      const newSelfie: IndividualSelfie = {
        id: `selfie-${Date.now()}`,
        photoUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        capturedAt: new Date().toISOString(),
        geoLocation: assignedGeo,
        status: "verified_demo",
      };

      onSaveSelfie(newSelfie);
      toast.success(`Geo-tagged photo uploaded for ${personName}!`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleLoadSample = () => {
    setUploadedPhotoUrl(SAMPLE_GEO_IMAGE_URL);
    const sampleFileName = `${personName.replace(/\s+/g, "_")}_GPS_Map_Camera.jpg`;
    setFileName(sampleFileName);
    setFileSize(539113);
    setGeoTag(SAMPLE_GEO_DATA);
    setTempLat(SAMPLE_GEO_DATA.latitude.toString());
    setTempLng(SAMPLE_GEO_DATA.longitude.toString());
    setTempAddress(SAMPLE_GEO_DATA.addressString || "");

    const newSelfie: IndividualSelfie = {
      id: `selfie-${Date.now()}`,
      photoUrl: SAMPLE_GEO_IMAGE_URL,
      fileName: sampleFileName,
      fileSize: 539113,
      capturedAt: new Date().toISOString(),
      geoLocation: SAMPLE_GEO_DATA,
      status: "verified_demo",
    };

    onSaveSelfie(newSelfie);
    toast.success(`Applied sample GPS Map Camera image for ${personName}`);
  };

  const handleSaveGeoEdit = () => {
    const lat = parseFloat(tempLat) || 13.0063;
    const lng = parseFloat(tempLng) || 80.2574;
    const updatedGeo: GeoLocationTag = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: geoTag?.timestamp || new Date().toISOString(),
      addressString: tempAddress.trim() || undefined,
    };
    setGeoTag(updatedGeo);
    setIsEditingGeo(false);

    if (uploadedPhotoUrl) {
      const updatedSelfie: IndividualSelfie = {
        id: existingSelfie?.id || `selfie-${Date.now()}`,
        photoUrl: uploadedPhotoUrl,
        fileName,
        fileSize,
        capturedAt: existingSelfie?.capturedAt || new Date().toISOString(),
        geoLocation: updatedGeo,
        status: "verified_demo",
      };
      onSaveSelfie(updatedSelfie);
      toast.success("Updated location details");
    }
  };

  const handleRemove = () => {
    setUploadedPhotoUrl(null);
    setGeoTag(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info(`Removed geo-tagged photo for ${personName}`);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      {/* HEADER & STATUS */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Geo-Location Verification Photo
            </h4>
            <p className="text-xs text-muted-foreground">
              {personName} • {personRole}
            </p>
          </div>
        </div>

        {uploadedPhotoUrl ? (
          <Badge className="bg-emerald-600 text-white text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Geo-Tagged Photo Uploaded
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40">
            <AlertCircle className="mr-1 h-3 w-3" />
            Photo Required
          </Badge>
        )}
      </div>

      {/* COMPLIANCE NOTICE: EXISTING UPLOAD ONLY (NO CAMERA) */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                GPS Map Camera Format Required
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Direct device camera capture is disabled. Customers must upload an existing photo captured using a <strong>GPS Map Camera app</strong> (e.g., GPS Map Camera or Solocator). The uploaded image must show the person&apos;s face along with the stamped location, coordinates, address, and date/time watermark.
              </p>
            </div>
          </div>

          {/* VIEW EXAMPLE MODAL TRIGGER */}
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
                  <MapPin className="h-4 w-4 text-primary" />
                  Sample GPS Map Camera Verification Image
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Your uploaded image must resemble this format, taken using a GPS Map Camera app showing your face and the stamped location metadata banner.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="relative overflow-hidden rounded-xl border bg-black shadow-md">
                  <img
                    src={SAMPLE_GEO_IMAGE_URL}
                    alt="Sample GPS Map Camera"
                    className="w-full max-h-[380px] object-contain mx-auto"
                  />
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground">Mandatory Elements Visible in Photo:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                    <li><strong>Clear Face View:</strong> Face looking toward camera, matching official KYC ID.</li>
                    <li><strong>Google Map Pin:</strong> Embedded map thumbnail showing physical location.</li>
                    <li><strong>GPS Coordinates:</strong> Accurate Latitude &amp; Longitude (e.g. Lat 13.0063° Long 80.2574°).</li>
                    <li><strong>Address:</strong> Full business / residential street address, city, state, postal code, and country.</li>
                    <li><strong>Timestamp:</strong> Date, time, and timezone (GMT +05:30) stamped by the camera app.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setExampleDialogOpen(false);
                      handleLoadSample();
                    }}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Use This Sample Image
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* STATE 1: ALREADY UPLOADED PREVIEW */}
      {uploadedPhotoUrl ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border bg-muted/20 p-3.5">
            {/* THUMBNAIL WITH ZOOM DIALOG */}
            <div className="relative group h-36 w-28 overflow-hidden rounded-lg border shadow-sm shrink-0 bg-slate-900 cursor-pointer" onClick={() => setPreviewDialogOpen(true)}>
              <img
                src={uploadedPhotoUrl}
                alt={`Geo-tagged image of ${personName}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium">
                <Eye className="mr-1 h-3.5 w-3.5" /> View
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
                    {personName}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {fileName} {fileSize > 0 ? `(${(fileSize / 1024).toFixed(1)} KB)` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {personRole}
                </Badge>
              </div>

              {/* LOCATION DETAILS */}
              {geoTag && (
                <div className="rounded-lg border bg-background p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        Lat: {geoTag.latitude}° N, Long: {geoTag.longitude}° E
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.google.com/maps?q=${geoTag.latitude},${geoTag.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5 text-[11px] font-medium"
                      >
                        <span>Google Maps</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingGeo(!isEditingGeo)}
                        className="h-5 px-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-2.5 w-2.5 mr-0.5" />
                        {isEditingGeo ? "Close" : "Edit"}
                      </Button>
                    </div>
                  </div>

                  {geoTag.addressString && (
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {geoTag.addressString}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Captured: {new Date(geoTag.timestamp).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {/* OPTIONAL INLINE GEO EDITOR */}
              {isEditingGeo && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-2">
                  <p className="font-medium text-[11px] text-foreground">
                    Edit Stamped Metadata Values
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-[10px]">Latitude</Label>
                      <Input
                        value={tempLat}
                        onChange={(e) => setTempLat(e.target.value)}
                        placeholder="13.0063"
                        className="h-7 text-xs bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Longitude</Label>
                      <Input
                        value={tempLng}
                        onChange={(e) => setTempLng(e.target.value)}
                        placeholder="80.2574"
                        className="h-7 text-xs bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px]">Address</Label>
                    <Input
                      value={tempAddress}
                      onChange={(e) => setTempAddress(e.target.value)}
                      placeholder="Street, City, State, Country"
                      className="h-7 text-xs bg-background"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveGeoEdit}
                      className="h-6 text-xs px-2"
                    >
                      <Check className="mr-1 h-3 w-3" /> Save Details
                    </Button>
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs"
                >
                  <Upload className="mr-1 h-3 w-3" />
                  Upload Replacement
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDialogOpen(true)}
                  className="h-7 text-xs"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  View Full Image
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

          {/* FULL RESOLUTION PREVIEW DIALOG */}
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-primary" />
                  Uploaded Geo-Tagged Photo: {personName} ({personRole})
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {fileName} • Stamped with GPS Map Camera location and timestamp
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-hidden rounded-xl border bg-black mt-2">
                <img
                  src={uploadedPhotoUrl}
                  alt={`Full size geo photo of ${personName}`}
                  className="w-full max-h-[500px] object-contain mx-auto"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        /* STATE 2: NO IMAGE UPLOADED YET (DRAG & DROP ZONE) */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-6 text-center space-y-3 transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50 bg-muted/10"
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Upload Existing Geo-Tagged Image
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Drag &amp; drop your GPS Map Camera photo here, or browse files from your computer.
            </p>
            <p className="text-[11px] text-muted-foreground italic">
              Accepted formats: JPG, JPEG, PNG, WebP (max 15MB)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Select Photo File
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="text-xs border-dashed"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Use Sample Photo (Adyar, Chennai)
            </Button>
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
