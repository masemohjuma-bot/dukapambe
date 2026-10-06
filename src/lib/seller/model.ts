export const steps = [
  "Business information",
  "Owner information",
  "Business documents",
  "Bank & payment",
  "Store setup",
  "Review",
] as const;
export type Fields = Record<string, string>;
export type Application = {
  user_id: string;
  id: string;
  data: Fields[];
  completed_steps: number[];
  revision: number;
  terms_version: string | null;
  submitted_at: string | null;
};
export type DocumentRecord = {
  kind: string;
  path: string;
  bucket: string;
  name: string;
  mime: string;
  size: number;
};
export type Field = {
  key: string;
  label: string;
  type?: string;
  optional?: boolean;
  choices?: string[];
};
export const fields: Field[][] = [
  [
    { key: "business_name", label: "Business Name" },
    {
      key: "business_type",
      label: "Business Type",
      choices: ["Sole proprietor", "Partnership", "Company"],
    },
    { key: "business_category", label: "Business Category" },
    { key: "country", label: "Country" },
    { key: "region", label: "Region" },
    { key: "district", label: "District" },
    { key: "physical_address", label: "Physical Address" },
    { key: "business_description", label: "Business Description" },
    { key: "years_in_business", label: "Years in Business", type: "number" },
    { key: "website", label: "Website", type: "url", optional: true },
    { key: "business_email", label: "Business Email", type: "email" },
    { key: "business_phone", label: "Business Phone", type: "tel" },
    { key: "gps_location", label: "GPS Location (latitude, longitude)", optional: true },
    { key: "registration_number", label: "Business Registration / License Number" },
  ],
  [
    { key: "owner_name", label: "Owner Full Name" },
    { key: "nationality", label: "Nationality" },
    { key: "national_id", label: "National ID / Passport Number" },
    { key: "date_of_birth", label: "Date of Birth", type: "date" },
    { key: "gender", label: "Gender", choices: ["Female", "Male", "Other", "Prefer not to say"] },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "alternative_phone", label: "Alternative Phone", type: "tel", optional: true },
    { key: "email", label: "Email", type: "email" },
    { key: "residential_address", label: "Residential Address" },
  ],
  [],
  [
    { key: "bank_name", label: "Bank Name", optional: true },
    { key: "account_name", label: "Account Name", optional: true },
    { key: "account_number", label: "Account Number", optional: true },
    { key: "branch", label: "Branch", optional: true },
    { key: "swift_code", label: "Swift Code", optional: true },
    { key: "mobile_money_provider", label: "Mobile Money Provider", optional: true },
    { key: "mobile_money_number", label: "Mobile Money Number", type: "tel", optional: true },
    {
      key: "preferred_payment_method",
      label: "Preferred Payment Method",
      choices: ["Bank", "Mobile money"],
    },
  ],
  [
    { key: "store_name", label: "Store Name" },
    { key: "store_slug", label: "Store Slug" },
    { key: "store_description", label: "Store Description" },
    { key: "business_hours", label: "Business Hours (e.g. Mon–Fri 09:00–17:00)" },
    {
      key: "delivery_options",
      label: "Delivery Options",
      choices: ["Delivery", "Pickup", "Delivery and pickup"],
    },
    { key: "pickup_available", label: "Pickup Available", choices: ["Yes", "No"] },
    { key: "shipping_regions", label: "Shipping Regions (comma separated)" },
  ],
  [],
];
export const documentKinds = [
  { kind: "business_license", label: "Business License", required: true },
  { kind: "tin_certificate", label: "TIN Certificate", required: false },
  { kind: "national_id", label: "National ID", required: true },
  { kind: "passport", label: "Passport", required: false },
  { kind: "company_registration", label: "Company Registration Certificate", required: false },
  { kind: "proof_of_address", label: "Proof of Address", required: true },
];
export function validateStep(
  step: number,
  data: Fields[],
  documents: DocumentRecord[] = [],
): string[] {
  const values = data[step] ?? {};
  const errors = (fields[step] ?? []).flatMap((f) => {
    const value = (values[f.key] ?? "").trim();
    if (!value) return f.optional ? [] : [`${f.label} is required.`];
    if (value.length > 2000) return [`${f.label} is too long (maximum 2,000 characters).`];
    if (f.choices && !f.choices.includes(value)) return [`Choose a valid ${f.label}.`];
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return [`Enter a valid ${f.label}.`];
    if (f.type === "tel" && !/^\+?[0-9 ()-]{7,20}$/.test(value))
      return [`Enter a valid ${f.label}.`];
    if (f.type === "url" && !/^https?:\/\/[^\s]+$/.test(value))
      return ["Website must start with https:// or http://."];
    return [];
  });
  if (step === 0) {
    if (!/^\d{1,3}$/.test(values["years_in_business"] ?? ""))
      errors.push("Years in Business must be a whole number from 0 to 999.");
    if (values["gps_location"]) {
      const coordinates = values["gps_location"].split(",").map(Number);
      if (
        !/^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(values["gps_location"]) ||
        Math.abs(coordinates[0] ?? 91) > 90 ||
        Math.abs(coordinates[1] ?? 181) > 180
      )
        errors.push("Enter valid GPS coordinates as latitude, longitude.");
    }
  }
  if (
    step === 1 &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(values["date_of_birth"] ?? "") ||
      (values["date_of_birth"] ?? "") >= new Date().toISOString().slice(0, 10))
  )
    errors.push("Enter a past Date of Birth.");
  if (step === 2) {
    for (const doc of documentKinds)
      if (
        (doc.required ||
          (doc.kind === "company_registration" && data[0]?.["business_type"] === "Company")) &&
        !documents.some((d) => d.kind === doc.kind)
      )
        errors.push(`${doc.label} is required.`);
  }
  if (step === 3)
    for (const key of values["preferred_payment_method"] === "Bank"
      ? ["bank_name", "account_name", "account_number", "branch"]
      : ["mobile_money_provider", "mobile_money_number"])
      if (!values[key]?.trim())
        errors.push(
          `${fields[3]?.find((f) => f.key === key)?.label} is required for this payment method.`,
        );
  if (step === 4 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values["store_slug"] ?? ""))
    errors.push("Store Slug must contain lowercase letters, numbers, and single hyphens.");
  return errors;
}
export function sellerDestination(status?: string, accountStatus?: string): string {
  if (accountStatus === "SUSPENDED" || accountStatus === "BLOCKED" || accountStatus === "DISABLED")
    return "/seller/status";
  if (status === "APPROVED") return "/seller/dashboard";
  if (
    !status ||
    status === "DRAFT" ||
    status === "REJECTED" ||
    status === "MORE_INFORMATION_REQUIRED"
  )
    return "/seller/register";
  return "/seller/status";
}
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export async function validateUpload(file: File, imageOnly = false) {
  if (!file.size || file.size > MAX_FILE_SIZE)
    throw new Error("Choose a non-empty file no larger than 10 MB.");
  const allowed = imageOnly
    ? ["image/png", "image/jpeg"]
    : ["application/pdf", "image/png", "image/jpeg"];
  if (!allowed.includes(file.type))
    throw new Error(imageOnly ? "Use a PNG or JPEG image." : "Use a PDF, PNG, or JPEG file.");
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const valid =
    file.type === "application/pdf"
      ? String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
      : file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid) throw new Error("The file contents do not match its file type.");
}
