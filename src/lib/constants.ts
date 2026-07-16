export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

// Minimum days between two whole-blood donations
export const ELIGIBLE_DAYS = 90;

// Savar upazila localities. Stored in the DB as these stable keys;
// display labels live in messages/bn.json + en.json under "areas".
export const AREAS = [
  "savar_bazar",
  "nabinagar",
  "ashulia",
  "hemayetpur",
  "genda",
  "radio_colony",
  "bank_town",
  "crp",
  "ju_campus",
  "epz",
  "baipail",
  "zirani",
  "jirabo",
  "aminbazar",
  "birulia",
  "savar_cantonment",
  "other",
] as const;
export type AreaKey = (typeof AREAS)[number];

// Hospital name suggestions for the request form (free text + datalist).
// Keys map to labels in messages under "hospitals".
export const HOSPITAL_KEYS = [
  "enam",
  "gonoshasthaya",
  "upazila_health",
  "super_clinic",
  "crp_hospital",
  "labzone",
  "prince",
  "deepto",
] as const;

// Max open requests one user can have at a time (anti-spam)
export const MAX_OPEN_REQUESTS_PER_USER = 3;

// SMS alert fan-out per request
export const ALERT_DONORS_PER_REQUEST = 10;
// Max alert SMS one donor receives per 7 days
export const ALERT_WEEKLY_LIMIT_PER_DONOR = 3;
// Max OTP sends per user per hour
export const OTP_HOURLY_LIMIT = 3;
export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;
