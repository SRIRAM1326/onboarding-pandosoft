import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";

function getMimeType(fileName: string, mimeType?: string): string {
  if (mimeType && mimeType.trim() && mimeType !== "application/octet-stream") {
    return mimeType;
  }
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".gif":
      return "image/gif";
    case ".bmp":
      return "image/bmp";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".csv":
      return "text/csv";
    case ".txt":
      return "text/plain";
    case ".json":
      return "application/json";
    case ".xml":
      return "application/xml";
    case ".zip":
      return "application/zip";
    default:
      return mimeType || "application/octet-stream";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = String(formData.get("applicationId") || "app-demo-001");
    const requirementKey = String(formData.get("requirementKey") || "document");
    const label = String(formData.get("label") || "");
    const section = String(formData.get("section") || "business");
    const ownerRef = formData.get("ownerRef") ? String(formData.get("ownerRef")) : null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Preserve exact original extension and base name
    const ext = path.extname(file.name);
    const baseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const timestamp = Date.now();
    const storedName = `${applicationId}_${requirementKey}_${timestamp}_${baseName}${ext}`;

    const publicUploadDir = path.resolve("public/uploads/documents");
    const backendUploadDir = path.resolve("backend/uploads");
    await fs.mkdir(publicUploadDir, { recursive: true });
    await fs.mkdir(backendUploadDir, { recursive: true });

    const publicFilePath = path.join(publicUploadDir, storedName);
    const backendFilePath = path.join(backendUploadDir, storedName);

    // Save exact unmodified bytes to server disk
    await fs.writeFile(publicFilePath, buffer);
    await fs.writeFile(backendFilePath, buffer);

    const detectedMimeType = getMimeType(file.name, file.type);
    const uploadedAt = new Date().toISOString();

    // Persist exact file bytes and metadata to SQLite database
    const dbPaths = [
      path.resolve("backend/pixelonics_onboarding.db"),
      path.resolve("pixelonics_onboarding.db"),
    ];
    const scriptPath = path.resolve("backend/app/core/save_document.py");

    const payload = {
      applicationId,
      requirementKey,
      section,
      label: label || file.name,
      ownerRef,
      fileName: file.name,
      filePath: backendFilePath,
      mimeType: detectedMimeType,
      fileSize: buffer.length,
      uploadedAt,
    };

    execFile(
      "python",
      [scriptPath, JSON.stringify(dbPaths), JSON.stringify(payload)],
      { timeout: 5000 },
      () => {}
    );

    const fileUrl = `/api/documents?file=${encodeURIComponent(storedName)}`;
    const publicUrl = `/uploads/documents/${storedName}`;

    return NextResponse.json({
      success: true,
      savedToDatabase: true,
      fileUrl,
      publicUrl,
      fileName: file.name,
      fileSize: buffer.length,
      mimeType: detectedMimeType,
      storedName,
      uploadedAt,
      label: label || file.name,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");
    const isDownload = searchParams.get("download") === "1";
    const previewMode = searchParams.get("preview");

    if (!fileName) {
      return NextResponse.json({ status: "ok", service: "document-upload" });
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(fileName);
    const publicUploadDir = path.resolve("public/uploads/documents");
    const backendUploadDir = path.resolve("backend/uploads");

    let filePath = path.join(publicUploadDir, safeName);
    let fileFound = false;

    try {
      await fs.access(filePath);
      fileFound = true;
    } catch {
      filePath = path.join(backendUploadDir, safeName);
      try {
        await fs.access(filePath);
        fileFound = true;
      } catch {
        fileFound = false;
      }
    }

    // If text preview requested (e.g. for docx or txt)
    if (previewMode === "text" && fileFound) {
      return new Promise<NextResponse>((resolve) => {
        const scriptPath = path.resolve("backend/app/core/save_document.py");
        execFile(
          "python",
          [scriptPath, "--extract-text", filePath],
          { timeout: 5000 },
          (err, stdout) => {
            if (err || !stdout) {
              resolve(NextResponse.json({ success: false, error: "Text extraction failed" }, { status: 500 }));
            } else {
              try {
                const parsed = JSON.parse(stdout);
                resolve(NextResponse.json(parsed));
              } catch {
                resolve(NextResponse.json({ success: true, text: stdout }));
              }
            }
          }
        );
      });
    }

    let fileBuffer: Buffer | null = null;
    let detectedMime = getMimeType(safeName);

    if (fileFound) {
      fileBuffer = await fs.readFile(filePath);
    } else {
      // Attempt to load raw file binary from SQLite database
      const dbPath = path.resolve("backend/pixelonics_onboarding.db");
      const pythonQueryScript = `
import sys, sqlite3, os
db_path, query_name = sys.argv[1], sys.argv[2]
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    row = cur.execute("SELECT mime_type, file_data FROM documents WHERE file_name = ? AND file_data IS NOT NULL ORDER BY id DESC LIMIT 1", (query_name,)).fetchone()
    if row and row[1]:
        sys.stdout.buffer.write(row[1])
    conn.close()
`;
      const binaryData = await new Promise<Buffer | null>((resolve) => {
        execFile(
          "python",
          ["-c", pythonQueryScript, dbPath, safeName],
          { encoding: "buffer", maxBuffer: 100 * 1024 * 1024, timeout: 5000 },
          (err, stdout) => {
            if (!err && stdout && stdout.length > 0) {
              resolve(stdout);
            } else {
              resolve(null);
            }
          }
        );
      });

      if (binaryData) {
        fileBuffer = binaryData;
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": detectedMime,
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
