import io
import zipfile
from datetime import datetime
from xml.sax.saxutils import escape

DECLARATION_TITLES = {
    "board_resolution": "Board Resolution / Authorization Letter",
    "lien_undertaking": "Customer Undertaking for Lien Resolution",
    "aml_acknowledgement": "AML Acknowledgement",
    "source_of_funds_declaration": "Source of Funds Declaration",
    "ubo_declaration": "UBO Declaration Form",
    "wallet_declaration": "Wallet Declaration",
    "client_onboarding_form": "Client Onboarding Form",
    "otc_aml_agreement": "OTC Anti-Money Laundering (AML) Agreement",
}


def build_declaration_sections(app_obj, declaration_key: str):
    title = DECLARATION_TITLES.get(declaration_key, "Corporate Onboarding Declaration")
    legal_name = app_obj.legal_name or "Applicant Entity"
    pan = app_obj.pan or "N/A"
    reg_no = app_obj.registration_number or "N/A"
    gstin = app_obj.gstin or "N/A"
    sig = app_obj.signatory or {}
    sig_name = sig.get("fullName") or "Authorized Signatory"
    sig_desig = sig.get("designation") or "Director / Authorized Signatory"
    sig_pan = sig.get("pan") or "N/A"
    fin = app_obj.financial or {}
    bank = fin.get("bankAccount") or {}
    ubos = app_obj.beneficial_owners or []
    wallets = app_obj.wallets or []

    sections = [
        ("Document Reference", f"{app_obj.reference_number} - {declaration_key.upper()}"),
        ("Generated Date", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")),
        ("Entity Legal Name", legal_name),
        ("Entity Type", (app_obj.entity_type or "private_limited").replace("_", " ").title()),
        ("PAN / CIN", f"PAN: {pan} | Registration/CIN: {reg_no} | GSTIN: {gstin}"),
        ("Authorized Signatory", f"{sig_name} ({sig_desig}) - PAN: {sig_pan}"),
    ]

    if declaration_key == "board_resolution":
        body_paragraphs = [
            f"CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS / PARTNERS OF {legal_name.upper()}.",
            f"RESOLVED THAT {legal_name} is hereby authorized to open and operate a corporate institutional onboarding and OTC trading account with Pixelonics and Pandosoft India Private Limited.",
            f"RESOLVED FURTHER THAT {sig_name} ({sig_desig}) be and is hereby authorized to sign, execute, and submit all KYC documents, declarations, agreements, and instructions on behalf of {legal_name}.",
        ]
    elif declaration_key == "lien_undertaking":
        body_paragraphs = [
            f"We, {legal_name} (PAN: {pan}), hereby undertake that all funds transferred from our designated bank account ({bank.get('bankName', 'Bank')} A/C: {bank.get('accountNumber', 'N/A')}) are free from any encumbrance, lien, or third-party claim.",
            "In the event of any law-enforcement or banking hold/lien placed due to counterparty or remitter actions, we undertake to cooperate fully with Pixelonics and Pandosoft India Private Limited for immediate resolution and indemnification.",
        ]
    elif declaration_key == "client_onboarding_form":
        body_paragraphs = [
            f"This Client Onboarding Form summarizes the corporate KYC particulars submitted by {legal_name} under application reference {app_obj.reference_number}.",
            f"Designated Bank Account: {bank.get('bankName', 'N/A')} | Account Holder: {bank.get('accountHolderName', legal_name)} | Account No: {bank.get('accountNumber', 'N/A')} | IFSC: {bank.get('ifsc', 'N/A')}.",
            f"Expected Monthly Volume: {fin.get('expectedVolumeRange', 'As declared')} | Frequency: {fin.get('expectedFrequency', 'As declared')}.",
        ]
    elif declaration_key == "aml_acknowledgement":
        body_paragraphs = [
            "AML ACKNOWLEDGEMENT - USDT OTC TRANSACTIONS",
            f"Authorised Signatory: {sig_name} | PAN: {sig_pan} | Entity: {legal_name}",
            "As a Director/Proprietor, I acknowledge and accept the terms of Pandosoft India Pvt Limited ('Pandosoft Exchange') for USDT OTC transactions.",
            "I confirm that the USDT withdrawn or INR deposited will not be misused or involved in any AML issues. I understand and agree that Pandosoft India Pvt Ltd will not be responsible for any such misuse in the future and that I will be fully responsible for all such cases.",
            "Additionally, I affirm that all transactions conducted are lawful and compliant with relevant regulations, and I agree to cooperate with any audits or compliance checks as required by Pandosoft India Pvt Ltd.",
        ]
    elif declaration_key == "otc_aml_agreement":
        body_paragraphs = [
            f"This OTC AML Agreement is entered into by {legal_name} in connection with virtual digital asset (VDA) / OTC transactions facilitated via Pixelonics x Pandosoft India Private Limited.",
            "The Applicant confirms strict adherence to Prevention of Money Laundering Act (PMLA) obligations, Travel Rule requirements, sanctions screening, and customer due diligence standards.",
        ]
    elif declaration_key == "source_of_funds_declaration":
        body_paragraphs = [
            f"We, {legal_name}, hereby declare that the primary source of funds utilized for corporate OTC transactions is: {(fin.get('sourceOfFundsCategory') or 'business_revenue').replace('_', ' ').title()}.",
            f"Detailed Explanation: {fin.get('sourceOfFundsExplanation') or 'Legitimate corporate operating revenue and treasury reserves.'}",
            "We confirm that no funds originate from unlawful activities, sanctioned entities, or undisclosed third parties.",
        ]
    elif declaration_key == "ubo_declaration":
        ubo_lines = [
            f"- {u.get('fullName', 'Owner')} - {u.get('ownershipPercentage', 0)}% ({u.get('role', 'Shareholder')}, PAN: {u.get('pan', 'N/A')})"
            for u in ubos
        ] or ["- As declared in the onboarding application."]
        body_paragraphs = [
            f"We, {legal_name}, hereby declare the following Ultimate Beneficial Owners (UBOs) holding 25% or more ownership/control in accordance with compliance policy:",
            *ubo_lines,
        ]
    elif declaration_key == "wallet_declaration":
        wallet_lines = [
            f"- {w.get('label', 'Wallet')} ({w.get('network', 'N/A')}): {w.get('address', 'N/A')} [{w.get('walletType', 'self_custody')}]"
            for w in wallets
        ] or ["- As declared in the onboarding application."]
        body_paragraphs = [
            f"We, {legal_name}, hereby declare sole beneficial ownership and operational control over the following cryptocurrency wallet address(es):",
            *wallet_lines,
            "We confirm that these wallets are not shared with unauthorized third parties and will be used strictly for compliant corporate transactions.",
        ]
    else:
        body_paragraphs = [
            f"We, {legal_name}, confirm that all particulars furnished under {title} are true, complete, and accurate."
        ]

    return title, sections, body_paragraphs, sig_name, sig_desig, legal_name


def _pdf_escape(text: str) -> str:
    ascii_text = text.encode("ascii", "replace").decode("ascii")
    return ascii_text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap_text(text: str, width: int = 82):
    words = text.split()
    lines = []
    current = []
    length = 0
    for w in words:
        if length + len(w) + (1 if current else 0) > width:
            lines.append(" ".join(current))
            current = [w]
            length = len(w)
        else:
            current.append(w)
            length += len(w) + (1 if len(current) > 1 else 0)
    if current:
        lines.append(" ".join(current))
    return lines or [""]


def generate_pdf_bytes(app_obj, declaration_key: str) -> bytes:
    title, sections, body_paragraphs, sig_name, sig_desig, legal_name = build_declaration_sections(app_obj, declaration_key)

    lines = [
        ("F2", 11, "PIXELONICS x PANDOSOFT INDIA PRIVATE LIMITED"),
        ("F2", 15, title),
        ("F1", 10, "-" * 85),
    ]
    for k, v in sections:
        for wrapped in _wrap_text(f"{k}: {v}", 80):
            lines.append(("F1", 10, wrapped))
    lines.append(("F1", 10, "-" * 85))
    lines.append(("F1", 10, ""))

    for para in body_paragraphs:
        for wrapped in _wrap_text(para, 80):
            lines.append(("F1", 10, wrapped))
        lines.append(("F1", 10, ""))

    lines.append(("F1", 10, ""))
    lines.append(("F2", 10, f"For and on behalf of {legal_name}"))
    lines.append(("F1", 10, ""))
    lines.append(("F1", 10, "________________________________________"))
    lines.append(("F2", 10, sig_name))
    lines.append(("F1", 10, sig_desig))
    lines.append(("F1", 9, "(Authorized Signature & Company Stamp)"))

    y = 780
    stream_cmds = ["BT"]
    for font_key, font_size, text in lines:
        if y < 60:
            break
        stream_cmds.append(f"/{font_key} {font_size} Tf")
        stream_cmds.append(f"1 0 0 1 50 {y} Tm")
        stream_cmds.append(f"({_pdf_escape(text)}) Tj")
        y -= int(font_size * 1.55)
    stream_cmds.append("ET")
    content_stream = "\n".join(stream_cmds).encode("latin-1")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        f"6 0 obj\n<< /Length {len(content_stream)} >>\nstream\n".encode("latin-1") + content_stream + b"\nendstream\nendobj\n",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)

    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for off in offsets:
        pdf.extend(f"{off:010d} 00000 n \n".encode("latin-1"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("latin-1")
    )
    return bytes(pdf)


def generate_docx_bytes(app_obj, declaration_key: str) -> bytes:
    title, sections, body_paragraphs, sig_name, sig_desig, legal_name = build_declaration_sections(app_obj, declaration_key)

    paragraphs = [
        "PIXELONICS × PANDOSOFT INDIA PRIVATE LIMITED",
        title,
        "",
        *[f"{k}: {v}" for k, v in sections],
        "",
        *body_paragraphs,
        "",
        f"For and on behalf of {legal_name}",
        "",
        "________________________________________",
        sig_name,
        sig_desig,
        "(Authorized Signature & Company Stamp)",
    ]

    body_xml = "".join(
        f"<w:p><w:r><w:t>{escape(str(p))}</w:t></w:r></w:p>" for p in paragraphs
    )
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{body_xml}</w:body></w:document>"
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    )
    rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        "</Relationships>"
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml)
        zf.writestr("_rels/.rels", rels_xml)
        zf.writestr("word/document.xml", document_xml)
    return buf.getvalue()
