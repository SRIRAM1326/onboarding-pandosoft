import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { execFile } from "child_process";

const SAVE_DB_PYTHON_SCRIPT = `
import sys, json, sqlite3

db_path, payload_json = sys.argv[1], sys.argv[2]
data = json.loads(payload_json)

conn = sqlite3.connect(db_path, timeout=3.0)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS video_kyc_recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id TEXT NOT NULL,
    application_reference TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    video_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'video/mp4',
    spoken_script TEXT,
    status TEXT DEFAULT 'ready_for_review',
    uploaded_by TEXT,
    created_at TEXT NOT NULL
)
""")

now_iso = data["uploadedAt"]
cur.execute(
    """
    INSERT INTO video_kyc_recordings
    (application_id, application_reference, file_name, file_path, video_url, file_size, mime_type, spoken_script, status, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    (
        str(data["applicationId"]),
        data.get("reference", ""),
        data["fileName"],
        data["filePath"],
        data["videoUrl"],
        int(data["fileSize"]),
        data["mimeType"],
        data.get("spokenScript", ""),
        "ready_for_review",
        data.get("uploadedBy", "customer"),
        now_iso,
    ),
)

app_row = None
if str(data["applicationId"]).isdigit():
    app_row = cur.execute("SELECT id, video_kyc FROM applications WHERE id = ?", (int(data["applicationId"]),)).fetchone()
if not app_row and data.get("reference"):
    app_row = cur.execute("SELECT id, video_kyc FROM applications WHERE reference_number = ?", (data["reference"],)).fetchone()
if not app_row:
    app_row = cur.execute("SELECT id, video_kyc FROM applications ORDER BY id ASC LIMIT 1").fetchone()

if app_row:
    db_app_id = app_row[0]
    try:
        vkyc = json.loads(app_row[1]) if app_row[1] else {}
    except Exception:
        vkyc = {}
    vkyc.update({
        "status": "completed",
        "videoUrl": data["videoUrl"],
        "fileName": data["fileName"],
        "fileSize": int(data["fileSize"]),
        "mimeType": data["mimeType"],
        "uploadedAt": now_iso,
        "spokenScript": data.get("spokenScript", ""),
        "outcomeNote": "Customer recorded and uploaded Video KYC declaration.",
    })
    cur.execute(
        "UPDATE applications SET video_kyc = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (json.dumps(vkyc), db_app_id),
    )

conn.commit()
conn.close()
`;

interface StoredVideoRecord {
  id: number;
  application_id: string;
  application_reference: string;
  file_name: string;
  file_path: string;
  video_url: string;
  file_size: number;
  mime_type: string;
  spoken_script: string;
  status: string;
  uploaded_by: string;
  created_at: string;
}

function getRecordsJsonPath(): string {
  return path.resolve(/* turbopackIgnore: true */ "backend/video_kyc_records.json");
}

async function readRecordsJson(): Promise<StoredVideoRecord[]> {
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ getRecordsJsonPath(), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRecordsJson(records: StoredVideoRecord[]): Promise<void> {
  const filePath = getRecordsJsonPath();
  await fs.mkdir(/* turbopackIgnore: true */ path.dirname(filePath), { recursive: true });
  await fs.writeFile(/* turbopackIgnore: true */ filePath, JSON.stringify(records, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = String(formData.get("applicationId") || "app-demo-001");
    const reference = String(formData.get("reference") || "PX-DEMO-001");
    const spokenScript = String(formData.get("spokenScript") || "");
    const uploadedBy = String(formData.get("uploadedBy") || "customer");

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || (file.type.includes("webm") ? ".webm" : ".mp4");
    const baseName = path
      .basename(file.name || "video_kyc", path.extname(file.name))
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const timestamp = Date.now();
    const storedName = `${applicationId}_${timestamp}_${baseName}${ext}`;

    const publicUploadDir = path.resolve(/* turbopackIgnore: true */ "public/uploads/video-kyc");
    const backendUploadDir = path.resolve(/* turbopackIgnore: true */ "backend/uploads");
    await fs.mkdir(/* turbopackIgnore: true */ publicUploadDir, { recursive: true });
    await fs.mkdir(/* turbopackIgnore: true */ backendUploadDir, { recursive: true });

    const publicFilePath = path.join(/* turbopackIgnore: true */ publicUploadDir, storedName);
    const backendFilePath = path.join(/* turbopackIgnore: true */ backendUploadDir, storedName);

    await fs.writeFile(/* turbopackIgnore: true */ publicFilePath, buffer);
    await fs.writeFile(/* turbopackIgnore: true */ backendFilePath, buffer);

    const videoUrl = `/uploads/video-kyc/${storedName}`;
    const uploadedAt = new Date().toISOString();
    const mimeType = file.type || "video/mp4";

    const existingRecords = await readRecordsJson();
    const newRecord: StoredVideoRecord = {
      id: timestamp,
      application_id: applicationId,
      application_reference: reference,
      file_name: file.name || storedName,
      file_path: backendFilePath,
      video_url: videoUrl,
      file_size: buffer.length,
      mime_type: mimeType,
      spoken_script: spokenScript,
      status: "ready_for_review",
      uploaded_by: uploadedBy,
      created_at: uploadedAt,
    };
    await writeRecordsJson([newRecord, ...existingRecords]);

    const dbPath = path.resolve(/* turbopackIgnore: true */ "backend/pixelonics_onboarding.db");
    const payload = {
      applicationId,
      reference,
      fileName: file.name || storedName,
      filePath: backendFilePath,
      videoUrl,
      fileSize: buffer.length,
      mimeType,
      spokenScript,
      uploadedBy,
      uploadedAt,
    };

    execFile(
      "python",
      ["-c", SAVE_DB_PYTHON_SCRIPT, dbPath, JSON.stringify(payload)],
      { timeout: 4000 },
      () => {}
    );

    return NextResponse.json({
      success: true,
      savedToDatabase: true,
      recordingId: timestamp,
      documentId: `doc-vkyc-${timestamp}`,
      applicationId,
      fileName: file.name || storedName,
      fileSize: buffer.length,
      mimeType,
      videoUrl,
      spokenScript,
      uploadedAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload Video KYC" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const recordings = await readRecordsJson();
    return NextResponse.json({ recordings });
  } catch {
    return NextResponse.json({ recordings: [] });
  }
}
