from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.application import Application, ApplicationStatus
from app.models.document import Document, DocumentStatus
from app.models.audit import AuditLog
from app.models.notification import Notification, NotificationType

SEED_USERS = [
    {
        "email": "arjun.mehta@orbitrade.example",
        "full_name": "Arjun Mehta",
        "phone": "+91 98765 43210",
        "role": UserRole.CUSTOMER,
        "title": "Managing Director",
        "organization": "Orbitrade Solutions Pvt. Ltd.",
    },
    {
        "email": "rahul.verma@pixelonics.example",
        "full_name": "Rahul Verma",
        "phone": "+91 98765 44444",
        "role": UserRole.PIXELONICS_OPS,
        "title": "Operations Team",
        "organization": "Pixelonics",
    },
    {
        "email": "sneha.iyer@pandosoft.example",
        "full_name": "Sneha Iyer",
        "phone": "+91 98765 55555",
        "role": UserRole.PANDOSOFT_REVIEWER,
        "title": "Compliance Reviewer",
        "organization": "Pandosoft India Private Limited",
    },
    {
        "email": "manoj.kumar@pandosoft.example",
        "full_name": "Manoj Kumar",
        "phone": "+91 98765 66666",
        "role": UserRole.PANDOSOFT_APPROVER,
        "title": "Compliance Approver",
        "organization": "Pandosoft India Private Limited",
    },
    {
        "email": "neha.kulkarni@pixelonics.example",
        "full_name": "Neha Kulkarni",
        "phone": "+91 98765 11111",
        "role": UserRole.COMPLIANCE_REVIEWER,
        "title": "Compliance Reviewer",
        "organization": "Pixelonics",
    },
    {
        "email": "vikram.sethi@pixelonics.example",
        "full_name": "Vikram Sethi",
        "phone": "+91 98765 22222",
        "role": UserRole.COMPLIANCE_APPROVER,
        "title": "Compliance Approver",
        "organization": "Pixelonics",
    },
    {
        "email": "radhika.menon@pixelonics.example",
        "full_name": "Radhika Menon",
        "phone": "+91 98765 33333",
        "role": UserRole.ADMINISTRATOR,
        "title": "Head of Compliance",
        "organization": "Pixelonics",
    },
]

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        default_hash = get_password_hash("Password123!")
        created_users = {}
        for u in SEED_USERS:
            user = User(
                email=u["email"],
                full_name=u["full_name"],
                phone=u["phone"],
                role=u["role"],
                title=u["title"],
                organization=u["organization"],
                hashed_password=default_hash,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
            db.flush()
            created_users[u["email"]] = user

        customer = created_users["arjun.mehta@orbitrade.example"]
        ops_user = created_users["rahul.verma@pixelonics.example"]
        pan_user = created_users["sneha.iyer@pandosoft.example"]

        now_iso = datetime.now(timezone.utc).isoformat()
        app_record = Application(
            reference_number="PX-DEMO-001",
            customer_id=customer.id,
            status=ApplicationStatus.UNDER_REVIEW.value,
            legal_name="Orbitrade Solutions Pvt. Ltd.",
            entity_type="private_limited",
            entity_type_other="",
            pan="AABCO1234F",
            registration_number="U74999MH2020PTC123456",
            gstin="27AABCO1234F1Z5",
            udyam_number="",
            business_email="compliance@orbitrade.example",
            business_phone="+91 22 4567 8900",
            website="https://orbitrade.example",
            incorporation_date="2020-03-15",
            registered_address={
                "line1": "Plot 14, Sector 5, Vashi",
                "line2": "Navi Mumbai",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postalCode": "400703",
                "country": "India",
            },
            operational_address={
                "line1": "Plot 14, Sector 5, Vashi",
                "line2": "Navi Mumbai",
                "city": "Mumbai",
                "state": "Maharashtra",
                "postalCode": "400703",
                "country": "India",
            },
            operational_same_as_registered=True,
            directors=[
                {
                    "id": "dir-1",
                    "fullName": "Arjun Mehta",
                    "designation": "Managing Director",
                    "identificationNumber": "12345678",
                },
                {
                    "id": "dir-2",
                    "fullName": "Priya Nair",
                    "designation": "Director",
                    "identificationNumber": "87654321",
                },
            ],
            signatory={
                "fullName": "Arjun Mehta",
                "designation": "Managing Director",
                "email": "arjun.mehta@orbitrade.example",
                "mobile": "+91 98765 43210",
                "pan": "ABCDE1234F",
                "dateOfBirth": "1985-06-12",
                "idDocumentType": "aadhaar",
                "idDocumentNumber": "XXXX XXXX 1234",
                "residentialAddress": {
                    "line1": "101, Sea View Apartments",
                    "line2": "Bandra West",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "postalCode": "400050",
                    "country": "India",
                },
                "authorizationSignedAndStamped": True,
            },
            beneficial_owners=[
                {
                    "id": "ubo-1",
                    "fullName": "Arjun Mehta",
                    "ownershipPercentage": 65,
                    "role": "Director & Shareholder",
                    "pan": "ABCDE1234F",
                    "idDocumentType": "aadhaar",
                    "idDocumentNumber": "XXXX XXXX 1234",
                    "residentialAddress": {
                        "line1": "101, Sea View Apartments",
                        "line2": "Bandra West",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "postalCode": "400050",
                        "country": "India",
                    },
                    "countryOfResidence": "India",
                    "ownershipEvidence": "Share Certificate",
                },
                {
                    "id": "ubo-2",
                    "fullName": "Priya Nair",
                    "ownershipPercentage": 35,
                    "role": "Director & Shareholder",
                    "pan": "FGHIJ5678K",
                    "idDocumentType": "passport",
                    "idDocumentNumber": "P1234567",
                    "residentialAddress": {
                        "line1": "204, Palm Grove",
                        "line2": "Andheri East",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "postalCode": "400069",
                        "country": "India",
                    },
                    "countryOfResidence": "India",
                    "ownershipEvidence": "Share Certificate",
                },
            ],
            financial={
                "bankAccount": {
                    "bankName": "HDFC Bank",
                    "accountHolderName": "Orbitrade Solutions Pvt. Ltd.",
                    "accountNumber": "50100987651234",
                    "ifsc": "HDFC0001234",
                    "accountType": "current",
                },
                "sourceOfFundsCategory": "business_revenue",
                "sourceOfFundsExplanation": "Revenue generated from B2B technology consulting and OTC crypto liquidity services.",
                "expectedVolumeRange": "₹1 crore – ₹5 crore per month",
                "expectedFrequency": "Weekly",
                "tradingActivityDescription": "Institutional OTC trading facilitation with proper compliance controls.",
            },
            wallets=[
                {
                    "id": "wallet-1",
                    "label": "Trading Hot Wallet",
                    "network": "ethereum",
                    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    "walletType": "self_custody_software",
                    "ownershipDeclared": True,
                    "verificationMethod": "screenshot_review",
                    "verificationStatus": "pending",
                }
            ],
            declarations=[
                {
                    "key": "board_resolution",
                    "name": "Board Resolution / Authorization Letter",
                    "description": "Resolution authorizing onboarding and signatory powers.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": True,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "lien_undertaking",
                    "name": "Customer Undertaking for Lien Resolution",
                    "description": "Undertaking regarding lien resolution process.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": False,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "client_onboarding_form",
                    "name": "Client Onboarding Form",
                    "description": "Completed client onboarding form.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": True,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "otc_aml_agreement",
                    "name": "OTC AML Agreement",
                    "description": "Anti-Money Laundering agreement for OTC transactions.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": True,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "source_of_funds_declaration",
                    "name": "Source of Funds Declaration",
                    "description": "Declaration of source of funds.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": False,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "ubo_declaration",
                    "name": "UBO Declaration",
                    "description": "Ultimate Beneficial Ownership declaration.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": False,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
                {
                    "key": "wallet_declaration",
                    "name": "Wallet Declaration",
                    "description": "Declaration of wallet ownership and control.",
                    "hasTemplate": True,
                    "requiresSignature": True,
                    "requiresStamp": False,
                    "acknowledged": True,
                    "acknowledgedAt": now_iso,
                },
            ],
            video_kyc={"status": "not_scheduled", "durationMinutes": 15},
            assigned_pixelonics_ops_id=ops_user.id,
            assigned_pandosoft_reviewer_id=pan_user.id,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(app_record)
        db.flush()

        seed_docs = [
            ("business_pan", "business", "Business PAN Card", "Orbitrade_PAN.pdf", "verified_demo"),
            ("business_incorporation", "business", "Certificate of Incorporation", "Orbitrade_COI.pdf", "verified_demo"),
            ("business_gst", "business", "GST Certificate", "Orbitrade_GST_REG06.pdf", "verified_demo"),
            ("business_constitution", "business", "MOA & AOA", "Orbitrade_MOA_AOA.pdf", "ready_for_review"),
            ("business_address_proof", "business", "Business Address Proof", "Orbitrade_Lease_Vashi.pdf", "verified_demo"),
            ("signatory_pan", "signatory", "Signatory PAN Card", "Arjun_Mehta_PAN.pdf", "verified_demo"),
            ("signatory_identity", "signatory", "Identity Proof (Aadhaar)", "Arjun_Mehta_Aadhaar_Masked.pdf", "ready_for_review"),
            ("signatory_authorization", "signatory", "Board Resolution / Authorization Letter", "Board_Resolution_Signed.pdf", "ready_for_review"),
            ("fin_cancelled_cheque", "financial", "Cancelled Cheque", "HDFC_Cancelled_Cheque.pdf", "ready_for_review"),
            ("fin_bank_statements", "financial", "Bank Statements (last 6 months)", "HDFC_Statement_6M.pdf", "ready_for_review"),
            ("wallet_screenshot", "wallets", "Wallet Dashboard Screenshot", "ETH_HotWallet_Screenshot.png", "ready_for_review"),
            ("wallet_declaration", "wallets", "Wallet Ownership Declaration", "Wallet_Declaration_Signed.pdf", "ready_for_review"),
        ]
        for key, sec, label, fname, status in seed_docs:
            db.add(
                Document(
                    application_id=app_record.id,
                    document_type=key,
                    section=sec,
                    label=label,
                    file_name=fname,
                    file_path=f"./uploads/{fname}",
                    file_size=245760,
                    mime_type="image/png" if fname.endswith(".png") else "application/pdf",
                    status=status,
                    owner_ref="wallet-1" if sec == "wallets" else None,
                    version=1,
                    history=[{"version": 1, "fileName": fname, "fileSize": 245760, "uploadedAt": now_iso, "status": status}],
                    uploaded_by=customer.id,
                )
            )

        db.add(
            AuditLog(
                application_id=app_record.id,
                user_id=customer.id,
                action="application_submitted",
                description="Application PX-DEMO-001 submitted by Arjun Mehta.",
            )
        )
        db.add(
            Notification(
                user_id=customer.id,
                application_id=app_record.id,
                title="Application Under Review",
                message="Your application PX-DEMO-001 is currently under review by Pixelonics Operations and Pandosoft Compliance.",
                type=NotificationType.INFO,
                link="/portal/applications/app-demo-001",
            )
        )
        db.commit()
    finally:
        db.close()
