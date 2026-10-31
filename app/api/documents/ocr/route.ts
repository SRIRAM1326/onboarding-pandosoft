import { NextRequest, NextResponse } from "next/server";
import { scanDocumentWithBharatOcr, validatePanFormat, validateAadhaarFormat, detectPanOcrErrors, detectAadhaarOcrErrors } from "@/lib/utils/bharat-ocr-engine";
import type { ApplicationDocument } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { document, application, rawText } = body as {
      document?: ApplicationDocument;
      application?: any;
      rawText?: string;
    };

    if (!document) {
      return NextResponse.json({ error: "Document payload required" }, { status: 400 });
    }

    const result = scanDocumentWithBharatOcr(document, application, rawText);

    return NextResponse.json({
      success: true,
      bharatOcr: result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "BharatOCR scanning error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testPan = searchParams.get("testPan");
  const testAadhaar = searchParams.get("testAadhaar");

  const response: Record<string, any> = {
    service: "BharatOCR Engine",
    status: "active",
  };

  if (testPan) {
    response.panValidation = validatePanFormat(testPan);
    response.panOcrErrors = detectPanOcrErrors(testPan);
  }

  if (testAadhaar) {
    response.aadhaarValidation = validateAadhaarFormat(testAadhaar);
    response.aadhaarOcrErrors = detectAadhaarOcrErrors(testAadhaar);
  }

  return NextResponse.json(response);
}
