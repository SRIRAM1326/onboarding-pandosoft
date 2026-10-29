"use client";

const DB_NAME = "pixelonics_documents_db";
const DB_VERSION = 1;
const STORE_NAME = "documents";

export interface StoredDocumentBlob {
  id: string; // documentId
  applicationId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  blob: Blob;
  updatedAt: string;
}

function openDocumentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDocumentBlob(
  id: string,
  blob: Blob,
  fileName: string,
  mimeType: string,
  applicationId?: string
): Promise<void> {
  try {
    const db = await openDocumentDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const record: StoredDocumentBlob = {
        id,
        applicationId,
        fileName,
        fileSize: blob.size,
        mimeType: mimeType || blob.type || "application/pdf",
        blob,
        updatedAt: new Date().toISOString(),
      };
      store.put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // ignore
  }
}

export async function getDocumentBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDocumentDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        db.close();
        const res = req.result as StoredDocumentBlob | undefined;
        resolve(res?.blob || null);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}
