import sys
import json
import sqlite3
import os
from datetime import datetime, timezone

def save_document(db_paths_raw, payload_raw):
    try:
        db_paths = json.loads(db_paths_raw) if isinstance(db_paths_raw, str) else db_paths_raw
    except Exception:
        db_paths = [db_paths_raw]

    try:
        data = json.loads(payload_raw) if isinstance(payload_raw, str) else payload_raw
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON payload: {e}"}))
        return

    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File path does not exist: {file_path}"}))
        return

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    app_id_raw = data.get("applicationId", "app-demo-001")
    req_key = data.get("requirementKey", "document")
    section = data.get("section", "business")
    label = data.get("label") or data.get("fileName") or req_key
    owner_ref = data.get("ownerRef")
    file_name = data.get("fileName") or os.path.basename(file_path)
    mime_type = data.get("mimeType") or "application/octet-stream"
    file_size = len(file_bytes)
    now_iso = data.get("uploadedAt") or datetime.now(timezone.utc).isoformat()

    results = []

    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
        try:
            conn = sqlite3.connect(db_path, timeout=5.0)
            cur = conn.cursor()

            # Ensure file_data column exists
            cols = [col[1] for col in cur.execute("PRAGMA table_info(documents)").fetchall()]
            if "file_data" not in cols:
                cur.execute("ALTER TABLE documents ADD COLUMN file_data BLOB")
                conn.commit()

            # Find matching application
            app_row = None
            if str(app_id_raw).isdigit():
                app_row = cur.execute("SELECT id FROM applications WHERE id = ?", (int(app_id_raw),)).fetchone()
            if not app_row:
                app_row = cur.execute("SELECT id FROM applications WHERE reference_number = 'PX-DEMO-001'").fetchone()
            if not app_row:
                app_row = cur.execute("SELECT id FROM applications ORDER BY id ASC LIMIT 1").fetchone()
            
            db_app_id = app_row[0] if app_row else 1

            # Check if document exists
            query = "SELECT id, version, history FROM documents WHERE application_id = ? AND document_type = ?"
            params = [db_app_id, req_key]
            if owner_ref:
                query += " AND owner_ref = ?"
                params.append(owner_ref)
            else:
                query += " AND (owner_ref IS NULL OR owner_ref = '')"

            doc_row = cur.execute(query, tuple(params)).fetchone()

            if doc_row:
                doc_id = doc_row[0]
                version = (doc_row[1] or 1) + 1
                try:
                    hist = json.loads(doc_row[2]) if doc_row[2] else []
                except Exception:
                    hist = []
                hist.append({
                    "version": version,
                    "fileName": file_name,
                    "fileSize": file_size,
                    "uploadedAt": now_iso,
                    "status": "ready_for_review"
                })

                cur.execute("""
                    UPDATE documents
                    SET version = ?,
                        file_name = ?,
                        file_path = ?,
                        file_size = ?,
                        mime_type = ?,
                        file_data = ?,
                        status = 'ready_for_review',
                        label = ?,
                        section = ?,
                        history = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (version, file_name, file_path, file_size, mime_type, sqlite3.Binary(file_bytes), label, section, json.dumps(hist), doc_id))
            else:
                hist = [{
                    "version": 1,
                    "fileName": file_name,
                    "fileSize": file_size,
                    "uploadedAt": now_iso,
                    "status": "ready_for_review"
                }]
                cur.execute("""
                    INSERT INTO documents (
                        application_id, document_type, section, label, file_name,
                        file_path, file_size, mime_type, status, owner_ref,
                        version, history, file_data, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (
                    db_app_id, req_key, section, label, file_name,
                    file_path, file_size, mime_type, "ready_for_review", owner_ref,
                    1, json.dumps(hist), sqlite3.Binary(file_bytes)
                ))
                doc_id = cur.lastrowid

            # Insert audit log
            cur.execute("""
                INSERT INTO audit_logs (application_id, user_id, action, description, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (db_app_id, 1, "document_uploaded", f"Uploaded {label} ({file_name}) - preserved exact original format and content"))

            # Update application timestamp
            cur.execute("UPDATE applications SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (db_app_id,))

            conn.commit()
            conn.close()
            results.append({"db": db_path, "success": True, "documentId": doc_id})
        except Exception as e:
            results.append({"db": db_path, "success": False, "error": str(e)})

    print(json.dumps({"success": True, "savedToDatabase": True, "results": results}))

if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--extract-text":
        if len(sys.argv) >= 3:
            target_path = sys.argv[2]
            if not os.path.exists(target_path):
                print(json.dumps({"success": False, "error": "File not found"}))
                sys.exit(0)
            ext = os.path.splitext(target_path)[1].lower()
            if ext == ".docx":
                try:
                    import zipfile
                    import xml.etree.ElementTree as ET
                    with zipfile.ZipFile(target_path) as z:
                        xml_content = z.read("word/document.xml")
                        tree = ET.fromstring(xml_content)
                        paragraphs = []
                        for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                            texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
                            if texts:
                                paragraphs.append("".join(texts))
                        print(json.dumps({"success": True, "text": "\n\n".join(paragraphs)}))
                        sys.exit(0)
                except Exception as e:
                    print(json.dumps({"success": False, "error": str(e)}))
                    sys.exit(0)
            else:
                try:
                    with open(target_path, "r", encoding="utf-8", errors="replace") as f:
                        print(json.dumps({"success": True, "text": f.read(50000)}))
                        sys.exit(0)
                except Exception as e:
                    print(json.dumps({"success": False, "error": str(e)}))
                    sys.exit(0)
    elif len(sys.argv) >= 3:
        save_document(sys.argv[1], sys.argv[2])
    else:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
