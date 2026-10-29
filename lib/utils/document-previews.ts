import type { Application, ApplicationDocument } from "@/lib/types";

export function isImageFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith("image/")) return true;
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".bmp") ||
    lower.endsWith(".ico") ||
    lower.endsWith(".tiff")
  );
}

export function isPdfFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType === "application/pdf") return true;
  if (!fileName) return false;
  return fileName.toLowerCase().endsWith(".pdf");
}

export function isWordFile(fileName?: string, mimeType?: string): boolean {
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return true;
  }
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith(".docx") || lower.endsWith(".doc");
}

export function isTextFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType && (mimeType.startsWith("text/") || mimeType === "application/json" || mimeType === "application/xml")) {
    return true;
  }
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".md") ||
    lower.endsWith(".log")
  );
}

export function isSpreadsheetFile(fileName?: string, mimeType?: string): boolean {
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv"
  ) {
    return true;
  }
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv");
}

export function getDocumentFormatLabel(fileName?: string, mimeType?: string): string {
  if (isPdfFile(fileName, mimeType)) return "PDF Document (application/pdf)";
  if (isImageFile(fileName, mimeType)) {
    const ext = fileName?.split(".").pop()?.toUpperCase() || "IMAGE";
    return `${ext} Image (${mimeType || "image/*"})`;
  }
  if (fileName?.toLowerCase().endsWith(".doc") || mimeType === "application/msword") {
    return "Microsoft Word Document (.doc)";
  }
  if (isWordFile(fileName, mimeType)) {
    return "Microsoft Word Document (.docx)";
  }
  if (isSpreadsheetFile(fileName, mimeType)) {
    const ext = fileName?.split(".").pop()?.toUpperCase() || "EXCEL";
    return `${ext} Spreadsheet`;
  }
  if (isTextFile(fileName, mimeType)) {
    const ext = fileName?.split(".").pop()?.toUpperCase() || "TEXT";
    return `${ext} Plain Text`;
  }
  const ext = fileName?.split(".").pop()?.toUpperCase();
  if (ext) return `${ext} Document (${mimeType || "application/octet-stream"})`;
  return mimeType || "Original Uploaded Document";
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface DocumentTextDetails {
  title: string;
  subtitle: string;
  entityName: string;
  registrationNumber: string;
  pan: string;
  address: string;
  signatoryName: string;
  signatoryDesignation: string;
  paragraphs: string[];
  referenceNumber: string;
  date: string;
  isLandscape: boolean;
}

export function getDocumentTextDetails(
  doc: ApplicationDocument,
  app?: Application
): DocumentTextDetails {
  const legalName = app?.business.legalName?.trim() || "Orbitrade Solutions Pvt. Ltd.";
  const pan = app?.business.pan?.trim() || "AABCO1234F";
  const cin = app?.business.registrationNumber?.trim() || "U74999MH2020PTC123456";
  const signatoryName = app?.signatory.fullName?.trim() || "Arjun Mehta";
  const signatoryDesig = app?.signatory.designation?.trim() || "Managing Director";
  const ref = app?.reference || "PX-DEMO-001";
  const addr = app?.business.registeredAddress;
  const address = addr
    ? [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")
    : "Plot 14, Sector 5, Vashi, Navi Mumbai, Maharashtra 400703";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const key = (doc.requirementKey || "").toLowerCase();
  const label = doc.label || "Corporate Document";

  const baseDetails = {
    entityName: legalName,
    registrationNumber: cin,
    pan,
    address,
    signatoryName,
    signatoryDesignation: signatoryDesig,
    referenceNumber: ref,
    date: dateStr,
    isLandscape: false,
  };

  if (
    key.includes("board_resolution") ||
    key.includes("authorization") ||
    label.toLowerCase().includes("board resolution")
  ) {
    return {
      ...baseDetails,
      title: "BOARD RESOLUTION / AUTHORIZATION LETTER",
      subtitle: "Certified True Copy on Corporate Letterhead",
      paragraphs: [
        `CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF ${legalName.toUpperCase()} HELD AT ITS REGISTERED OFFICE.`,
        `RESOLVED THAT the Company approves the opening and operation of an institutional onboarding and OTC cryptocurrency trading account with Pixelonics x Pandosoft India Private Limited.`,
        `RESOLVED FURTHER THAT ${signatoryName} (${signatoryDesig}) be and is hereby authorized to negotiate, execute, and sign all agreements, declarations, undertakings, and submit KYC documents for and on behalf of ${legalName}.`,
        `RESOLVED FURTHER THAT all acts, deeds, and things done by the said Authorized Signatory shall be binding upon the Company in all respects.`,
      ],
    };
  }

  if (key.includes("lien") || label.toLowerCase().includes("lien")) {
    return {
      ...baseDetails,
      title: "CUSTOMER UNDERTAKING FOR LIEN RESOLUTION",
      subtitle: "Solemn Undertaking & Dispute Indemnity",
      paragraphs: [
        `We, ${legalName} (PAN: ${pan}), having registered office at ${address}, hereby formally undertake that:`,
        `1. All funds transferred to and from our designated bank account (${app?.financial.bankAccount.bankName || "HDFC Bank"} A/C: ${app?.financial.bankAccount.accountNumber || "50200012345678"}) represent legitimate corporate reserves and revenue.`,
        `2. In the event of any banking lien, freeze, or cyber-cell inquiry arising from remitter disputes, we undertake to immediately indemnify and hold harmless Pixelonics and Pandosoft India Private Limited.`,
        `3. We confirm that funds used are not borrowed public money, pooled retail funds, or sourced from unauthorized money-changing networks.`,
      ],
    };
  }

  if (key.includes("aml") || label.toLowerCase().includes("aml")) {
    return {
      ...baseDetails,
      title: "ANTI-MONEY LAUNDERING (AML) ACKNOWLEDGEMENT",
      subtitle: "PMLA / FIU-IND Regulatory Compliance Declaration",
      paragraphs: [
        `The undersigned, representing ${legalName}, acknowledges that all OTC trading and settlement transactions are subject to the Prevention of Money Laundering Act (PMLA) 2002 and FIU-IND reporting directives.`,
        `We confirm that neither the Company, its directors, nor beneficial owners are listed on any domestic or international sanctions lists (OFAC, UN, EU).`,
        `We agree to provide transaction-level source of funds evidence and bank remittance slips whenever requested by the compliance department.`,
      ],
    };
  }

  if (key.includes("source_of_funds") || label.toLowerCase().includes("source of funds")) {
    return {
      ...baseDetails,
      title: "SOURCE OF FUNDS DECLARATION",
      subtitle: "Institutional Corporate Capital Affirmation",
      paragraphs: [
        `We hereby solemnly affirm that the source of capital utilized for corporate trading activities under Application ${ref} is derived strictly from:`,
        `"${app?.financial.sourceOfFundsExplanation || "Legitimate commercial business revenues and treasury retained earnings."}"`,
        `Expected Monthly Volume: ${app?.financial.expectedVolumeRange || "₹1 crore – ₹5 crore per month"} across designated corporate bank accounts.`,
      ],
    };
  }

  if (key.includes("ubo") || label.toLowerCase().includes("ubo")) {
    return {
      ...baseDetails,
      title: "ULTIMATE BENEFICIAL OWNERSHIP (UBO) DECLARATION",
      subtitle: "Declaration of Natural Persons Holding Controlling Interest",
      paragraphs: [
        `We hereby declare that the following individuals are the Ultimate Beneficial Owners (UBOs) holding 25% or more controlling equity/voting interest in ${legalName}:`,
        ...(app?.beneficialOwners.map(
          (u) => `• ${u.fullName} — ${u.ownershipPercentage}% Ownership (${u.role}, PAN: ${u.pan})`
        ) || [`• ${signatoryName} — 100% Beneficial Owner`]),
      ],
    };
  }

  if (key.includes("wallet") || label.toLowerCase().includes("wallet")) {
    return {
      ...baseDetails,
      title: "CORPORATE CRYPTO WALLET DECLARATION",
      subtitle: "Sole Ownership & Whitelist Affirmation",
      paragraphs: [
        `We declare that the cryptocurrency wallet addresses registered under ${ref} are exclusively owned and operated by ${legalName}:`,
        ...(app?.wallets.map(
          (w) => `• [${w.network.toUpperCase()}] ${w.label}: ${w.address} (Self-custody)`
        ) || [`• Ethereum Hot Wallet: ${app?.wallets[0]?.address || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"}`]),
        `We confirm that private keys are held solely by authorized officers, and the wallet is not used for custodial pooling of third-party funds.`,
      ],
    };
  }

  // Default generic document
  return {
    ...baseDetails,
    title: label.toUpperCase(),
    subtitle: "Official Corporate Verification Record",
    isLandscape: key.includes("pan") || key.includes("cheque") || key.includes("screenshot"),
    paragraphs: [
      `Document Label: ${label}`,
      `File Name: ${doc.fileName} (v${doc.version})`,
      `Section: ${doc.section || "Corporate Onboarding"} • Uploaded on ${new Date(doc.uploadedAt).toLocaleString()}`,
      `Verified against applicant corporate records for ${legalName} (PAN: ${pan}, CIN: ${cin}).`,
    ],
  };
}

/**
 * Generates an authentic, high-fidelity SVG preview with explicit pixel width & height
 * ensuring it never collapses to 0x0 on any device or browser.
 */
export function getSimulatedDocumentPreview(
  doc: ApplicationDocument,
  app?: Application
): string {
  const legalName = escapeXml(app?.business.legalName || "Orbitrade Solutions Pvt. Ltd.");
  const pan = escapeXml(app?.business.pan || "AABCO1234F");
  const cin = escapeXml(app?.business.registrationNumber || "U74999MH2020PTC123456");
  const gstin = escapeXml(app?.business.gstin || "27AABCO1234F1Z5");
  const signatoryName = escapeXml(app?.signatory.fullName || "Arjun Mehta");
  const signatoryPan = escapeXml(app?.signatory.pan || "ABCDE1234F");
  const signatoryDesig = escapeXml(app?.signatory.designation || "Managing Director");
  const bankName = escapeXml(app?.financial.bankAccount.bankName || "HDFC Bank");
  const accNo = escapeXml(app?.financial.bankAccount.accountNumber || "50200012345678");
  const ifsc = escapeXml(app?.financial.bankAccount.ifsc || "HDFC0000123");
  const walletAddr = escapeXml(app?.wallets[0]?.address || "0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
  const ref = escapeXml(app?.reference || "PX-DEMO-001");
  const label = escapeXml(doc.label);
  const fileName = escapeXml(doc.fileName);
  const key = (doc.requirementKey || "").toLowerCase();
  const labelLower = doc.label.toLowerCase();

  // 1. BUSINESS PAN CARD (Landscape 800x500)
  if (key === "business_pan") {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <defs>
        <linearGradient id="panBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="50%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#e0f2fe"/>
        </linearGradient>
      </defs>
      <rect width="800" height="500" rx="20" fill="url(#panBg)" stroke="#0284c7" stroke-width="3"/>
      <rect x="20" y="20" width="760" height="60" rx="10" fill="#0369a1"/>
      <text x="400" y="55" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">INCOME TAX DEPARTMENT - GOVT. OF INDIA</text>
      
      <circle cx="90" cy="140" r="35" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      <text x="90" y="146" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0369a1" text-anchor="middle">GOVT SEAL</text>
      
      <text x="160" y="130" font-family="Arial, sans-serif" font-size="14" fill="#64748b">Permanent Account Number (Company)</text>
      <text x="160" y="165" font-family="Courier, monospace" font-size="28" font-weight="bold" fill="#0f172a" letter-spacing="4">${pan}</text>
      
      <line x1="40" y1="200" x2="760" y2="200" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <text x="60" y="240" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Name of Entity / Taxpayer</text>
      <text x="60" y="270" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${legalName}</text>
      
      <text x="60" y="320" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Incorporation / Registration Date</text>
      <text x="60" y="345" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">15/03/2020</text>
      
      <rect x="580" y="230" width="160" height="160" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
      <rect x="600" y="250" width="120" height="120" fill="#0f172a"/>
      <text x="660" y="315" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">NSDL QR VERIFIED</text>
      
      <rect x="40" y="420" width="720" height="50" rx="8" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="400" y="450" font-family="Arial, sans-serif" font-size="13" fill="#0284c7" text-anchor="middle">✓ Verified Corporate Tax Identity — Active in NSDL Central Database</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 2. SIGNED BOARD RESOLUTION / AUTHORIZATION LETTER (Portrait 800x1050)
  if (
    key.includes("board_resolution") ||
    key.includes("authorization") ||
    labelLower.includes("board resolution")
  ) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
      <defs>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1"/>
        </filter>
      </defs>
      <rect width="800" height="1050" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#shadow)"/>
      
      <!-- TOP LETTERHEAD -->
      <rect x="0" y="0" width="800" height="16" fill="#0f172a"/>
      <rect x="50" y="45" width="700" height="90" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="400" y="85" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle">${legalName.toUpperCase()}</text>
      <text x="400" y="112" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">CIN: ${cin}  |  PAN: ${pan}  |  GSTIN: ${gstin}</text>
      <text x="400" y="128" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Registered Office: Plot 14, Sector 5, Vashi, Navi Mumbai, Maharashtra 400703</text>
      
      <line x1="50" y1="150" x2="750" y2="150" stroke="#0f172a" stroke-width="2"/>
      
      <!-- TITLE -->
      <text x="400" y="190" font-family="Georgia, serif" font-size="16" font-weight="bold" fill="#1e293b" text-anchor="middle">CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE</text>
      <text x="400" y="215" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle">BOARD OF DIRECTORS OF ${legalName.toUpperCase()}</text>
      
      <rect x="50" y="235" width="700" height="35" rx="6" fill="#f1f5f9"/>
      <text x="70" y="258" font-family="Arial, sans-serif" font-size="12" fill="#475569">Reference: <tspan font-weight="bold" fill="#0f172a">${ref}</tspan>  |  Meeting Date: 20th October 2026</text>
      <text x="730" y="258" font-family="Arial, sans-serif" font-size="12" fill="#0284c7" font-weight="bold" text-anchor="end">EXECUTED &amp; FILED</text>
      
      <!-- RESOLUTION CLAUSES -->
      <g font-family="Arial, sans-serif" font-size="13" fill="#334155" line-height="1.6">
        <text x="50" y="305" font-weight="bold" fill="#0f172a">1. APPROVAL FOR ONBOARDING &amp; TRADING ACCOUNT OPENING:</text>
        <text x="50" y="335">"RESOLVED THAT the Company be and is hereby authorized to open, execute, and maintain</text>
        <text x="50" y="358">a corporate onboarding and institutional cryptocurrency OTC trading account with Pixelonics</text>
        <text x="50" y="381">x Pandosoft India Private Limited."</text>
        
        <text x="50" y="425" font-weight="bold" fill="#0f172a">2. AUTHORIZATION OF CORPORATE SIGNATORY:</text>
        <text x="50" y="455">"RESOLVED FURTHER THAT <tspan font-weight="bold" fill="#0f172a">${signatoryName}</tspan> (${signatoryDesig}) be and is hereby severally</text>
        <text x="50" y="478">authorized to negotiate, finalise, sign, execute, and submit all application forms, client</text>
        <text x="50" y="501">declarations, KYC dossiers, undertakings, and operating instructions for the trading account."</text>
        
        <text x="50" y="545" font-weight="bold" fill="#0f172a">3. SPECIMEN SIGNATURE &amp; BINDING POWERS:</text>
        <text x="50" y="575">"RESOLVED FURTHER THAT all acts, deeds, and things done by the said Authorized Signatory</text>
        <text x="50" y="598">shall be deemed fully binding upon ${legalName} for all legal and settlement purposes."</text>
      </g>
      
      <!-- SIGNATURE BLOCK & COMPANY STAMP -->
      <rect x="50" y="650" width="700" height="240" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="80" y="685" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">For and on behalf of ${legalName}:</text>
      
      <!-- SIGNATURE -->
      <g transform="translate(80, 710)">
        <path d="M 10 40 Q 50 10 90 35 T 160 30 T 220 45" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>
        <line x1="10" y1="65" x2="250" y2="65" stroke="#94a3b8" stroke-width="1"/>
        <text x="10" y="85" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${signatoryName}</text>
        <text x="10" y="105" font-family="Arial, sans-serif" font-size="12" fill="#64748b">${signatoryDesig} (Authorized Signatory)</text>
        <text x="10" y="125" font-family="Arial, sans-serif" font-size="11" fill="#64748b">PAN: ${signatoryPan}</text>
      </g>
      
      <!-- OFFICIAL CIRCULAR CORPORATE RUBBER STAMP -->
      <g transform="translate(520, 710)">
        <circle cx="85" cy="55" r="55" fill="none" stroke="#15803d" stroke-width="3" stroke-dasharray="6 3"/>
        <circle cx="85" cy="55" r="47" fill="none" stroke="#15803d" stroke-width="1.5"/>
        <text x="85" y="38" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">${legalName.slice(0, 18).toUpperCase()}</text>
        <text x="85" y="58" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#15803d" text-anchor="middle">★ OFFICIAL SEAL ★</text>
        <text x="85" y="78" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#15803d" text-anchor="middle">CORP STAMP</text>
      </g>
      
      <!-- COMPLIANCE VERIFICATION BANNER -->
      <rect x="50" y="920" width="700" height="50" rx="8" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="400" y="950" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#15803d" text-anchor="middle">✓ Executed Copy on Corporate Letterhead • Signed &amp; Stamped for Officer Review</text>
      
      <rect x="0" y="1034" width="800" height="16" fill="#0f172a"/>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 3. CERTIFICATE OF INCORPORATION (Portrait 800x1050)
  if (key === "business_incorporation") {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
      <rect width="800" height="1050" rx="16" fill="#fffdfa" stroke="#d97706" stroke-width="3"/>
      <rect x="30" y="30" width="740" height="990" fill="none" stroke="#fcd34d" stroke-width="2" stroke-dasharray="8 4"/>
      
      <text x="400" y="80" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#78350f" text-anchor="middle">GOVERNMENT OF INDIA</text>
      <text x="400" y="110" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#92400e" text-anchor="middle">MINISTRY OF CORPORATE AFFAIRS</text>
      <text x="400" y="150" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#b45309" text-anchor="middle">CERTIFICATE OF INCORPORATION</text>
      
      <line x1="150" y1="175" x2="650" y2="175" stroke="#d97706" stroke-width="2"/>
      
      <text x="400" y="220" font-family="Arial, sans-serif" font-size="13" fill="#451a03" text-anchor="middle">[Pursuant to sub-section (2) of section 7 and sub-section (1) of section 8 of the Companies Act, 2013]</text>
      
      <text x="80" y="290" font-family="Georgia, serif" font-size="16" fill="#1c1917">I hereby certify that <tspan font-weight="bold" fill="#78350f">${legalName}</tspan> is incorporated on this</text>
      <text x="80" y="320" font-family="Georgia, serif" font-size="16" fill="#1c1917">Fifteenth day of March Two thousand twenty under the Companies Act, 2013</text>
      <text x="80" y="350" font-family="Georgia, serif" font-size="16" fill="#1c1917">and that the company is limited by shares.</text>
      
      <rect x="80" y="400" width="640" height="110" rx="8" fill="#fef3c7" stroke="#f59e0b"/>
      <text x="110" y="440" font-family="Arial, sans-serif" font-size="14" fill="#92400e">Corporate Identity Number (CIN):</text>
      <text x="110" y="480" font-family="Courier, monospace" font-size="24" font-weight="bold" fill="#78350f">${cin}</text>
      
      <text x="80" y="560" font-family="Arial, sans-serif" font-size="14" fill="#451a03">Permanent Account Number (PAN): <tspan font-weight="bold">${pan}</tspan></text>
      <text x="80" y="600" font-family="Arial, sans-serif" font-size="14" fill="#451a03">Registered Office: Plot 14, Sector 5, Vashi, Navi Mumbai, Maharashtra 400703</text>
      <text x="80" y="640" font-family="Arial, sans-serif" font-size="14" fill="#451a03">Registrar of Companies: ROC - Mumbai</text>
      
      <circle cx="620" cy="740" r="50" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="620" y="735" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">ROC MUMBAI</text>
      <text x="620" y="755" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">DIGITALLY SIGNED</text>
      
      <rect x="80" y="930" width="640" height="50" rx="6" fill="#f0fdf4" stroke="#86efac"/>
      <text x="400" y="960" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">✓ Validated against MCA-21 portal • Official Company Master Data Verified</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 4. GST CERTIFICATE (Portrait 800x1050)
  if (key === "business_gst") {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
      <rect width="800" height="1050" rx="16" fill="#ffffff" stroke="#10b981" stroke-width="3"/>
      <rect x="30" y="30" width="740" height="90" rx="8" fill="#065f46"/>
      <text x="400" y="72" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">Government of India — Form GST REG-06</text>
      <text x="400" y="100" font-family="Arial, sans-serif" font-size="14" fill="#a7f3d0" text-anchor="middle">Registration Certificate [See Rule 10(1)]</text>
      
      <rect x="50" y="150" width="700" height="90" rx="8" fill="#ecfdf5" stroke="#6ee7b7"/>
      <text x="80" y="185" font-family="Arial, sans-serif" font-size="13" fill="#047857">Goods and Services Tax Identification Number (GSTIN):</text>
      <text x="80" y="222" font-family="Courier, monospace" font-size="24" font-weight="bold" fill="#065f46">${gstin}</text>
      
      <text x="80" y="290" font-family="Arial, sans-serif" font-size="14" fill="#64748b">1. Legal Name:</text>
      <text x="260" y="290" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${legalName}</text>
      
      <text x="80" y="335" font-family="Arial, sans-serif" font-size="14" fill="#64748b">2. Trade Name:</text>
      <text x="260" y="335" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">${legalName}</text>
      
      <text x="80" y="380" font-family="Arial, sans-serif" font-size="14" fill="#64748b">3. Constitution of Business:</text>
      <text x="260" y="380" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">Private Limited Company</text>
      
      <text x="80" y="425" font-family="Arial, sans-serif" font-size="14" fill="#64748b">4. Principal Place of Business:</text>
      <text x="260" y="425" font-family="Arial, sans-serif" font-size="14" fill="#0f172a">Plot 14, Sector 5, Vashi, Navi Mumbai 400703</text>
      
      <text x="80" y="470" font-family="Arial, sans-serif" font-size="14" fill="#64748b">5. Date of Validity:</text>
      <text x="260" y="470" font-family="Arial, sans-serif" font-size="14" fill="#0f172a">From 20/03/2020 to Regular / Active</text>
      
      <rect x="50" y="530" width="700" height="90" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="80" y="565" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Jurisdictional Authority: Ward 4, Division Vashi, State Tax Officer Maharashtra</text>
      <text x="80" y="595" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#059669">✓ GSTIN Active on GST Common Portal • Return Filing Compliant</text>
      
      <rect x="50" y="930" width="700" height="50" rx="6" fill="#ecfdf5" stroke="#a7f3d0"/>
      <text x="400" y="960" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">✓ Verified with GSTN API &amp; PAN Linkage Check Passed</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 5. CANCELLED CHEQUE (Landscape 800x450)
  if (key === "fin_cancelled_cheque") {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" rx="12" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
      
      <rect x="30" y="30" width="740" height="60" fill="#1e3a8a" rx="6"/>
      <text x="50" y="68" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">${bankName.toUpperCase()}</text>
      <text x="730" y="68" font-family="Courier, monospace" font-size="14" fill="#93c5fd" text-anchor="end">IFSC: ${ifsc}</text>
      
      <text x="50" y="130" font-family="Arial, sans-serif" font-size="13" fill="#64748b">PAY __________________________________________________________________ OR BEARER</text>
      <text x="50" y="170" font-family="Arial, sans-serif" font-size="13" fill="#64748b">RUPEES __________________________________________________________________________</text>
      
      <rect x="50" y="220" width="400" height="50" rx="6" fill="#e2e8f0"/>
      <text x="70" y="240" font-family="Arial, sans-serif" font-size="11" fill="#64748b">A/C NO.</text>
      <text x="70" y="260" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="#0f172a">${accNo}</text>
      
      <text x="650" y="240" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">${legalName}</text>
      <text x="650" y="270" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Authorized Signatory</text>
      
      <g transform="rotate(-20 400 225)">
        <rect x="180" y="180" width="440" height="85" fill="none" stroke="#dc2626" stroke-width="6" rx="10"/>
        <text x="400" y="240" font-family="Arial, sans-serif" font-size="52" font-weight="900" fill="#dc2626" text-anchor="middle" letter-spacing="12">CANCELLED</text>
      </g>
      
      <rect x="30" y="380" width="740" height="40" fill="#f1f5f9" rx="6"/>
      <text x="400" y="405" font-family="Courier, monospace" font-size="15" fill="#475569" text-anchor="middle">⑈ 123456 ⑈  400240012 ⑈  ${accNo} ⑈ 29</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 6. SIGNATORY PAN / AADHAAR (Landscape 800x500)
  if (key === "signatory_pan" || key === "signatory_identity") {
    const isAadhaar = key === "signatory_identity";
    const docTitle = isAadhaar ? "UNIQUE IDENTIFICATION AUTHORITY OF INDIA - AADHAAR" : "INCOME TAX DEPARTMENT - SIGNATORY PAN";
    const idVal = isAadhaar ? "XXXX XXXX 1234" : signatoryPan;
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="800" height="500" rx="16" fill="#f8fafc" stroke="${isAadhaar ? "#ea580c" : "#0284c7"}" stroke-width="3"/>
      <rect x="20" y="20" width="760" height="60" rx="8" fill="${isAadhaar ? "#c2410c" : "#0369a1"}"/>
      <text x="400" y="55" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${docTitle}</text>
      
      <rect x="60" y="120" width="150" height="180" rx="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      <circle cx="135" cy="180" r="35" fill="#94a3b8"/>
      <path d="M85 270 C85 230 185 230 185 270" fill="#94a3b8"/>
      <text x="135" y="290" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">SIGNATORY PHOTO</text>
      
      <text x="250" y="145" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Authorized Signatory Name:</text>
      <text x="250" y="175" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${signatoryName}</text>
      
      <text x="250" y="220" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Identity Document Number:</text>
      <text x="250" y="255" font-family="Courier, monospace" font-size="26" font-weight="bold" fill="${isAadhaar ? "#c2410c" : "#0284c7"}">${idVal}</text>
      
      <text x="250" y="300" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Designation &amp; Entity:</text>
      <text x="250" y="325" font-family="Arial, sans-serif" font-size="15" fill="#0f172a">${signatoryDesig} • ${legalName}</text>
      
      <rect x="40" y="400" width="720" height="60" rx="8" fill="#f1f5f9"/>
      <text x="400" y="435" font-family="Arial, sans-serif" font-size="13" fill="#047857" text-anchor="middle">✓ Identity Verified against Government Registry • Masking Compliance Verified</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 7. WALLET SCREENSHOT (Landscape 800x500)
  if (key === "wallet_screenshot") {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="800" height="500" rx="16" fill="#0f172a" stroke="#334155" stroke-width="3"/>
      <rect x="25" y="25" width="750" height="50" rx="8" fill="#1e293b"/>
      <circle cx="50" cy="50" r="6" fill="#ef4444"/>
      <circle cx="70" cy="50" r="6" fill="#f59e0b"/>
      <circle cx="90" cy="50" r="6" fill="#10b981"/>
      <text x="400" y="55" font-family="Courier, monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Corporate Crypto Wallet Dashboard — Ethereum Mainnet</text>
      
      <rect x="50" y="100" width="700" height="110" rx="12" fill="#1e293b" stroke="#475569"/>
      <text x="80" y="135" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Active Wallet Address (Whitelisted):</text>
      <text x="80" y="170" font-family="Courier, monospace" font-size="17" font-weight="bold" fill="#38bdf8">${walletAddr}</text>
      <text x="700" y="165" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#34d399" text-anchor="end">● Connected</text>
      
      <rect x="50" y="230" width="335" height="130" rx="10" fill="#1e293b"/>
      <text x="80" y="265" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Account Label</text>
      <text x="80" y="300" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Trading Hot Wallet</text>
      <text x="80" y="330" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Self-Custody Software Wallet</text>
      
      <rect x="415" y="230" width="335" height="130" rx="10" fill="#1e293b"/>
      <text x="445" y="265" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8">Declared Beneficiary Entity</text>
      <text x="445" y="300" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${legalName}</text>
      <text x="445" y="330" font-family="Arial, sans-serif" font-size="12" fill="#10b981">Sole Ownership Declared</text>
      
      <rect x="50" y="390" width="700" height="70" rx="8" fill="#1e293b" stroke="#334155"/>
      <text x="400" y="430" font-family="Arial, sans-serif" font-size="13" fill="#38bdf8" text-anchor="middle">✓ Screenshot Verified by Operations • No Private Keys or Seed Phrases Revealed</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // 8. ALL OTHER DECLARATIONS & DOCUMENTS (Portrait 800x1050)
  const details = getDocumentTextDetails(doc, app);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
    <rect width="800" height="1050" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="0" y="0" width="800" height="14" fill="#0f172a"/>
    
    <!-- HEADER -->
    <rect x="50" y="45" width="700" height="85" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="400" y="80" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#0f172a" text-anchor="middle">${legalName.toUpperCase()}</text>
    <text x="400" y="105" font-family="Arial, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">CIN: ${cin}  |  PAN: ${pan}  |  Ref: ${ref}</text>
    
    <line x1="50" y1="145" x2="750" y2="145" stroke="#0f172a" stroke-width="2"/>
    
    <text x="400" y="180" font-family="Georgia, serif" font-size="17" font-weight="bold" fill="#0f172a" text-anchor="middle">${escapeXml(details.title)}</text>
    <text x="400" y="202" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${escapeXml(details.subtitle)}</text>
    
    <rect x="50" y="225" width="700" height="30" rx="4" fill="#f1f5f9"/>
    <text x="70" y="245" font-family="Arial, sans-serif" font-size="11" fill="#475569">Doc: ${label}  |  File: ${fileName}  |  Date: ${details.date}</text>
    <text x="730" y="245" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#15803d" text-anchor="end">DIGITALLY ATTACHED</text>
    
    <!-- PARAGRAPHS -->
    <g font-family="Arial, sans-serif" font-size="13" fill="#334155">
      ${details.paragraphs
        .map(
          (p, i) =>
            `<text x="50" y="${295 + i * 45}" width="700">${escapeXml(p.slice(0, 85))}${p.length > 85 ? `<tspan x="50" dy="20">${escapeXml(p.slice(85, 175))}</tspan>` : ""}</text>`
        )
        .join("")}
    </g>
    
    <!-- SIGNATURE BLOCK -->
    <rect x="50" y="650" width="700" height="240" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="80" y="685" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Authorized Representative Signature &amp; Seal:</text>
    
    <g transform="translate(80, 715)">
      <path d="M 10 35 Q 40 10 80 30 T 140 25 T 200 40" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>
      <line x1="10" y1="55" x2="240" y2="55" stroke="#94a3b8" stroke-width="1"/>
      <text x="10" y="75" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${signatoryName}</text>
      <text x="10" y="95" font-family="Arial, sans-serif" font-size="12" fill="#64748b">${signatoryDesig}</text>
      <text x="10" y="115" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Entity: ${legalName}</text>
    </g>
    
    <g transform="translate(520, 715)">
      <circle cx="85" cy="55" r="50" fill="none" stroke="#15803d" stroke-width="2.5" stroke-dasharray="5 2.5"/>
      <circle cx="85" cy="55" r="42" fill="none" stroke="#15803d" stroke-width="1"/>
      <text x="85" y="42" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#15803d" text-anchor="middle">OFFICIAL STAMP</text>
      <text x="85" y="60" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#15803d" text-anchor="middle">COMPANY SEAL</text>
      <text x="85" y="76" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#15803d" text-anchor="middle">VERIFIED</text>
    </g>
    
    <rect x="50" y="920" width="700" height="50" rx="8" fill="#f0fdf4" stroke="#bbf7d0"/>
    <text x="400" y="950" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#15803d" text-anchor="middle">✓ Executed Document Recorded for Officer Compliance Verification</text>
    
    <rect x="0" y="1036" width="800" height="14" fill="#0f172a"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
