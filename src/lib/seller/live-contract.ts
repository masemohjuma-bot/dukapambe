import { fields, type Application, type Fields } from "./model";
export type LiveApplication = Record<string, unknown> & {
  id: string;
  user_id: string;
  status: string;
  updated_at: string;
  completed_steps: number[];
  submitted_at: string | null;
};
const aliases: Record<string, string> = {
  registration_number: "business_registration_number",
  owner_name: "owner_full_name",
  nationality: "owner_nationality",
  national_id: "owner_identity_number",
  date_of_birth: "owner_date_of_birth",
  gender: "owner_gender",
  phone: "owner_phone",
  alternative_phone: "owner_alternative_phone",
  email: "owner_email",
  residential_address: "owner_residential_address",
  account_name: "bank_account_name",
  account_number: "bank_account_number",
  branch: "bank_branch",
  swift_code: "bank_swift_code",
};
export function fromLive(row: LiveApplication): Application {
  const data = fields.map((group) =>
    Object.fromEntries(
      group.map(({ key }) => {
        let value = row[aliases[key] ?? key];
        if (key === "gps_location")
          value =
            row["gps_latitude"] == null ? "" : `${row["gps_latitude"]}, ${row["gps_longitude"]}`;
        if (key === "business_hours")
          value =
            typeof value === "object" && value !== null
              ? ((value as Record<string, unknown>)["schedule"] ?? JSON.stringify(value))
              : value;
        if (key === "shipping_regions") value = Array.isArray(value) ? value.join(", ") : "";
        if (key === "delivery_options")
          value = Array.isArray(value) ? (value.length > 1 ? "Delivery and pickup" : value[0]) : "";
        if (key === "pickup_available") value = value ? "Yes" : "No";
        return [key, value == null ? "" : String(value)];
      }),
    ),
  );
  return {
    id: row.id,
    user_id: row.user_id,
    data,
    completed_steps: row.completed_steps.map((i) => i - 1),
    revision: row.updated_at,
    terms_version: null,
    submitted_at: row.submitted_at,
  };
}
export function stepPatch(step: number, values: Fields): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of fields[step] ?? []) {
    const key = field.key;
    const value = (values[key] ?? "").trim();
    if (key === "gps_location") {
      const parts = value.split(",").map(Number);
      if (
        value &&
        (parts.length !== 2 ||
          !parts.every(Number.isFinite) ||
          Math.abs(parts[0]!) > 90 ||
          Math.abs(parts[1]!) > 180)
      )
        throw new Error("Enter valid GPS coordinates as latitude, longitude.");
      patch["gps_latitude"] = value ? parts[0] : null;
      patch["gps_longitude"] = value ? parts[1] : null;
    } else if (key === "years_in_business") {
      if (value && (!/^\d+$/.test(value) || Number(value) > 200))
        throw new Error("Years in Business must be a whole number from 0 to 200.");
      patch[key] = value ? Number(value) : null;
    } else if (key === "date_of_birth") patch[aliases[key]!] = value || null;
    else if (key === "business_hours") {
      try {
        const parsed: unknown = JSON.parse(value);
        patch[key] =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : { schedule: value };
      } catch {
        patch[key] = { schedule: value };
      }
    } else if (key === "delivery_options")
      patch[key] = value === "Delivery and pickup" ? ["Delivery", "Pickup"] : value ? [value] : [];
    else if (key === "shipping_regions")
      patch[key] = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (key === "pickup_available") patch[key] = value === "Yes";
    else patch[aliases[key] ?? key] = value || (field.optional ? null : "");
  }
  return patch;
}
export const liveDocumentTypes: Record<string, string> = {
  business_license: "BUSINESS_LICENSE",
  tin_certificate: "TIN_CERTIFICATE",
  national_id: "NATIONAL_ID",
  passport: "PASSPORT",
  company_registration: "COMPANY_REGISTRATION_CERTIFICATE",
  proof_of_address: "PROOF_OF_ADDRESS",
};
