import type { BloodGroup } from "./constants";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  blood_group: BloodGroup;
  area: string;
  last_donation_date: string | null;
  is_available: boolean;
  sms_opt_in: boolean;
  phone_verified: boolean;
  is_verified: boolean;
  is_admin: boolean;
  avatar_url: string | null;
  created_at: string;
}

// Row shape of the donors_public view (no phone!)
export interface PublicDonor {
  id: string;
  full_name: string;
  blood_group: BloodGroup;
  area: string;
  is_available: boolean;
  is_verified: boolean;
  phone_verified: boolean;
  last_donation_date: string | null;
  avatar_url: string | null;
  is_eligible: boolean;
  created_at: string;
  donation_count: number;
}

export interface Testimonial {
  id: string;
  author_id: string;
  message: string;
  photo_url: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface TestimonialWithAuthor extends Testimonial {
  profiles: { full_name: string; area: string; avatar_url: string | null } | null;
}

export interface BloodRequest {
  id: string;
  patient_name: string;
  blood_group: BloodGroup;
  bags_needed: number;
  hospital: string;
  contact_phone: string;
  needed_by: string;
  details: string | null;
  status: "open" | "fulfilled" | "expired";
  created_by: string;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  donated_at: string;
  note: string | null;
  created_at: string;
}
