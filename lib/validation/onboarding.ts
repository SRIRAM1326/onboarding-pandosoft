import { z } from "zod";

export const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const businessSchema = z.object({
  legalName: z.string().min(1, "Legal business name is required"),
  entityType: z.string().min(1, "Business entity type is required"),
  entityTypeOther: z.string().optional(),
  pan: z.string().min(1, "PAN is required"),
  registrationNumber: z.string().optional(),
  gstin: z.string().optional(),
  udyamNumber: z.string().optional(),
  registeredAddress: addressSchema,
  operationalSameAsRegistered: z.boolean(),
  operationalAddress: addressSchema.optional(),
  email: z.string().email("Valid business email is required"),
  phone: z.string().min(1, "Business phone is required"),
  website: z.string().optional(),
  incorporationDate: z.string().min(1, "Date of incorporation/registration is required"),
});

export const signatorySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  designation: z.string().min(1, "Designation is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(1, "Mobile number is required"),
  pan: z.string().min(1, "PAN is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  idDocumentType: z.string().min(1, "Identity document type is required"),
  idDocumentNumber: z.string().min(1, "Identity document number is required"),
  residentialAddress: addressSchema,
  authorizationSignedAndStamped: z.boolean().optional(),
});

export const uboSchema = z.object({
  fullName: z.string().min(1, "Full legal name is required"),
  ownershipPercentage: z.number().min(0.01).max(100),
  role: z.string().min(1, "Role/relationship is required"),
  pan: z.string().min(1, "PAN is required"),
  idDocumentType: z.string().min(1, "Identity document type is required"),
  idDocumentNumber: z.string().min(1, "Identity document number is required"),
  residentialAddress: addressSchema,
  countryOfResidence: z.string().min(1, "Country of residence is required"),
  ownershipEvidence: z.string().min(1, "Ownership evidence is required"),
});

export const bankAccountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifsc: z.string().min(1, "IFSC is required"),
  accountType: z.string().min(1, "Account type is required"),
});

export const financialSchema = z.object({
  bankAccount: bankAccountSchema,
  sourceOfFundsCategory: z.string().min(1, "Source of funds category is required"),
  sourceOfFundsExplanation: z.string().min(10, "Please provide a detailed explanation (min 10 characters)"),
  expectedVolumeRange: z.string().min(1, "Expected trading volume range is required"),
  expectedFrequency: z.string().min(1, "Expected transaction frequency is required"),
  tradingActivityDescription: z.string().min(10, "Please describe the trading activity (min 10 characters)"),
});

export const walletSchema = z.object({
  label: z.string().min(1, "Wallet label/name is required"),
  network: z.string().min(1, "Blockchain/network is required"),
  address: z.string().min(1, "Wallet address is required"),
  walletType: z.string().min(1, "Wallet type is required"),
  ownershipDeclared: z.boolean().refine((v) => v, "You must declare ownership and control"),
  verificationMethod: z.string().optional(),
});
