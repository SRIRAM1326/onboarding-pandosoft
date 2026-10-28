import type { Application, DeclarationKey } from "@/lib/types";
import { appConfig } from "@/lib/config/env";

const DECLARATION_TITLES: Record<DeclarationKey, string> = {
  board_resolution: "Board Resolution / Authorization Letter",
  lien_undertaking: "Customer Undertaking for Lien Resolution",
  client_onboarding_form: "Client Onboarding Form",
  otc_aml_agreement: "OTC Anti-Money Laundering (AML) Agreement",
  source_of_funds_declaration: "Source of Funds Declaration",
  ubo_declaration: "Ultimate Beneficial Ownership (UBO) Declaration",
  wallet_declaration: "Crypto Wallet Ownership & Control Declaration",
};

function pdfEscape(text: string): string {
  const ascii = text.replace(/[^\x20-\x7E]/g, "-");
  return ascii.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars = 82): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + (current ? " " : "") + w).length > maxChars) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function buildDeclarationPdfBlob(app: Application, key: DeclarationKey): Blob {
  const title = DECLARATION_TITLES[key] || "Corporate Onboarding Declaration";
  const legalName = app.business.legalName || "Applicant Entity";
  const pan = app.business.pan || "N/A";
  const regNo = app.business.registrationNumber || "N/A";
  const gstin = app.business.gstin || "N/A";
  const sigName = app.signatory.fullName || "Authorized Signatory";
  const sigDesig = app.signatory.designation || "Director / Authorized Signatory";

  const metaLines = [
    `Reference: ${app.reference} | Template: ${key.toUpperCase()}`,
    `Generated Date: ${new Date().toISOString().slice(0, 10)}`,
    `Entity Legal Name: ${legalName}`,
    `PAN: ${pan} | CIN/Reg No: ${regNo} | GSTIN: ${gstin}`,
    `Authorized Signatory: ${sigName} (${sigDesig})`,
  ];

  let bodyParagraphs: string[] = [];
  switch (key) {
    case "board_resolution":
      bodyParagraphs = [
        `CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS / PARTNERS OF ${legalName.toUpperCase()}.`,
        `RESOLVED THAT ${legalName} be and is hereby authorized to open and operate a corporate institutional onboarding and OTC trading account with Pixelonics x Pandosoft India Private Limited.`,
        `RESOLVED FURTHER THAT ${sigName} (${sigDesig}) be and is hereby authorized to sign, execute, and submit all KYC documents, declarations, agreements, and instructions on behalf of ${legalName}.`,
      ];
      break;
    case "lien_undertaking":
      bodyParagraphs = [
        `We, ${legalName} (PAN: ${pan}), hereby undertake that all funds transferred from our designated bank account (${app.financial.bankAccount.bankName || "Bank"} A/C: ${app.financial.bankAccount.accountNumber || "N/A"}) are free from any encumbrance, lien, or third-party claim.`,
        "In the event of any law-enforcement or banking hold/lien placed due to counterparty or remitter actions, we undertake to cooperate fully with Pixelonics and Pandosoft India Private Limited for immediate resolution and indemnification.",
      ];
      break;
    case "client_onboarding_form":
      bodyParagraphs = [
        `This Client Onboarding Form summarizes the corporate KYC particulars submitted by ${legalName} under application reference ${app.reference}.`,
        `Designated Bank Account: ${app.financial.bankAccount.bankName || "N/A"} | Account No: ${app.financial.bankAccount.accountNumber || "N/A"} | IFSC: ${app.financial.bankAccount.ifsc || "N/A"}.`,
        `Expected Volume: ${app.financial.expectedVolumeRange || "As declared"} | Frequency: ${app.financial.expectedFrequency || "As declared"}.`,
      ];
      break;
    case "otc_aml_agreement":
      bodyParagraphs = [
        `This OTC AML Agreement is entered into by ${legalName} in connection with virtual digital asset (VDA) / OTC transactions facilitated via Pixelonics x Pandosoft India Private Limited.`,
        "The Applicant confirms strict adherence to Prevention of Money Laundering Act (PMLA) obligations, Travel Rule requirements, sanctions screening, and customer due diligence standards.",
      ];
      break;
    case "source_of_funds_declaration":
      bodyParagraphs = [
        `We, ${legalName}, hereby declare that the primary source of funds utilized for corporate OTC transactions is: ${(app.financial.sourceOfFundsCategory || "business_revenue").replace(/_/g, " ")}.`,
        `Explanation: ${app.financial.sourceOfFundsExplanation || "Corporate operating revenue and treasury reserves."}`,
        "We confirm that no funds originate from unlawful activities, sanctioned entities, or undisclosed third parties.",
      ];
      break;
    case "ubo_declaration":
      bodyParagraphs = [
        `We, ${legalName}, hereby declare the following Ultimate Beneficial Owners (UBOs) holding 25% or more ownership/control in accordance with compliance policy:`,
        ...(app.beneficialOwners.length
          ? app.beneficialOwners.map(
              (u) => `- ${u.fullName} (${u.ownershipPercentage}% ownership, ${u.role}, PAN: ${u.pan})`
            )
          : ["- As declared in the onboarding application."]),
      ];
      break;
    case "wallet_declaration":
      bodyParagraphs = [
        `We, ${legalName}, hereby declare sole beneficial ownership and operational control over the following cryptocurrency wallet address(es):`,
        ...(app.wallets.length
          ? app.wallets.map((w) => `- ${w.label} (${w.network}): ${w.address} [${w.walletType}]`)
          : ["- As declared in the onboarding application."]),
        "We confirm that these wallets are not shared with unauthorized third parties and will be used strictly for compliant corporate transactions.",
      ];
      break;
  }

  const lines: Array<{ font: "F1" | "F2"; size: number; text: string }> = [
    { font: "F2", size: 11, text: "PIXELONICS x PANDOSOFT INDIA PRIVATE LIMITED" },
    { font: "F2", size: 15, text: title },
    { font: "F1", size: 10, text: "-".repeat(82) },
  ];

  for (const m of metaLines) {
    for (const w of wrapText(m, 80)) {
      lines.push({ font: "F1", size: 10, text: w });
    }
  }
  lines.push({ font: "F1", size: 10, text: "-".repeat(82) });
  lines.push({ font: "F1", size: 10, text: "" });

  for (const p of bodyParagraphs) {
    for (const w of wrapText(p, 80)) {
      lines.push({ font: "F1", size: 10, text: w });
    }
    lines.push({ font: "F1", size: 10, text: "" });
  }

  lines.push({ font: "F2", size: 10, text: `For and on behalf of ${legalName}` });
  lines.push({ font: "F1", size: 10, text: "" });
  lines.push({ font: "F1", size: 10, text: "________________________________________" });
  lines.push({ font: "F2", size: 10, text: sigName });
  lines.push({ font: "F1", size: 10, text: sigDesig });
  lines.push({ font: "F1", size: 9, text: "(Authorized Signature & Company Stamp)" });

  let y = 780;
  const cmds = ["BT"];
  for (const item of lines) {
    if (y < 60) break;
    cmds.push(`/${item.font} ${item.size} Tf`);
    cmds.push(`1 0 0 1 50 ${y} Tm`);
    cmds.push(`(${pdfEscape(item.text)}) Tj`);
    y -= Math.round(item.size * 1.55);
  }
  cmds.push("ET");
  const stream = cmds.join("\n");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n";
  const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const obj6 = `6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;

  const objs = [obj1, obj2, obj3, obj4, obj5, obj6];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const o of objs) {
    offsets.push(pdf.length);
    pdf += o;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}

export async function downloadDeclarationDocument(
  app: Application,
  key: DeclarationKey,
  format: "pdf" | "docx" = "pdf"
): Promise<void> {
  const filename = `${app.reference}_${key}.${format}`;
  try {
    const res = await fetch(
      `${appConfig.apiBaseUrl}/documents/generate/1/${key}?format=${format}`,
      { method: "GET" }
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
  } catch {
    // Fallback to client-side PDF generator if backend isn't running
  }

  const blob = buildDeclarationPdfBlob(app, key);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${app.reference}_${key}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
