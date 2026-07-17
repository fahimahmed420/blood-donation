"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { normalizeBdPhone } from "./utils";
import { BLOOD_GROUPS, AREAS } from "./constants";

type ActionResult = { error?: string; profileId?: string };

export async function createProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = normalizeBdPhone(String(formData.get("phone") ?? ""));
  const bloodGroup = String(formData.get("blood_group") ?? "");
  const area = String(formData.get("area") ?? "");
  const lastDonation = String(formData.get("last_donation_date") ?? "") || null;
  const available = formData.get("available") === "on";
  const smsOptIn = formData.get("sms_opt_in") === "on";

  if (fullName.length < 2) return { error: "invalid_name" };
  if (!phone) return { error: "invalid_phone" };
  if (!BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number])) {
    return { error: "invalid_blood_group" };
  }
  if (!AREAS.includes(area as (typeof AREAS)[number])) return { error: "invalid_area" };

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    phone,
    blood_group: bloodGroup,
    area,
    last_donation_date: lastDonation,
    is_available: available,
    sms_opt_in: smsOptIn,
  });

  if (error) return { error: error.code === "23505" ? "already_registered" : "insert_failed" };

  revalidatePath("/", "layout");
  return { profileId: user.id };
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const area = String(formData.get("area") ?? "");
  const available = formData.get("available") === "on";
  const smsOptIn = formData.get("sms_opt_in") === "on";

  if (fullName.length < 2) return { error: "invalid_name" };
  if (!AREAS.includes(area as (typeof AREAS)[number])) return { error: "invalid_area" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, area, is_available: available, sms_opt_in: smsOptIn })
    .eq("id", user.id);

  if (error) return { error: "update_failed" };

  revalidatePath("/", "layout");
  return {};
}

export async function markDonatedAction(): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { error } = await supabase.from("donations").insert({ donor_id: user.id });
  if (error) return { error: "insert_failed" };

  revalidatePath("/dashboard");
  revalidatePath("/search");
  return {};
}

export async function markRequestFulfilledAction(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const { error } = await supabase
    .from("blood_requests")
    .update({ status: "fulfilled" })
    .eq("id", requestId);

  if (error) return { error: "update_failed" };

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return {};
}

export async function deleteRequestAction(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const { error } = await supabase.from("blood_requests").delete().eq("id", requestId);
  if (error) return { error: "delete_failed" };

  revalidatePath("/requests");
  revalidatePath("/admin");
  return {};
}

// ---------------------------------------------------------------------------
// Admin-only actions. Every one of these first confirms the caller is an
// admin, so nothing here relies on RLS alone. (The DB trigger also blocks a
// non-admin from flipping is_admin/is_verified, giving defence in depth.)
// ---------------------------------------------------------------------------

type AdminGate =
  | { error: string }
  | { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; userId: string };

async function requireAdmin(): Promise<AdminGate> {
  const supabase = await createClient();
  if (!supabase) return { error: "not_configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return { error: "forbidden" };

  return { supabase, userId: user.id };
}

export async function adminVerifyDonorAction(donorId: string): Promise<ActionResult> {
  return adminSetVerifiedAction(donorId, true);
}

export async function adminSetVerifiedAction(
  donorId: string,
  verified: boolean
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;

  const { error } = await gate.supabase
    .from("profiles")
    .update({ is_verified: verified })
    .eq("id", donorId);

  if (error) return { error: "update_failed" };

  revalidatePath("/admin");
  revalidatePath("/search");
  return {};
}

export async function adminSetAdminAction(
  donorId: string,
  makeAdmin: boolean
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;

  // Guard: an admin can't strip their own admin rights (avoids locking
  // everyone out of the panel by accident).
  if (donorId === gate.userId && !makeAdmin) return { error: "cannot_demote_self" };

  const { error } = await gate.supabase
    .from("profiles")
    .update({ is_admin: makeAdmin })
    .eq("id", donorId);

  if (error) return { error: "update_failed" };

  revalidatePath("/admin");
  return {};
}

export async function adminUpdateDonorAction(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;

  const donorId = String(formData.get("donor_id") ?? "");
  if (!donorId) return { error: "invalid_input" };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = normalizeBdPhone(String(formData.get("phone") ?? ""));
  const bloodGroup = String(formData.get("blood_group") ?? "");
  const area = String(formData.get("area") ?? "");
  const lastDonation = String(formData.get("last_donation_date") ?? "") || null;
  const available = formData.get("available") === "on";

  if (fullName.length < 2) return { error: "invalid_name" };
  if (!phone) return { error: "invalid_phone" };
  if (!BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number])) {
    return { error: "invalid_blood_group" };
  }
  if (!AREAS.includes(area as (typeof AREAS)[number])) return { error: "invalid_area" };

  const { error } = await gate.supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      blood_group: bloodGroup,
      area,
      last_donation_date: lastDonation,
      is_available: available,
    })
    .eq("id", donorId);

  if (error) return { error: error.code === "23505" ? "phone_taken" : "update_failed" };

  revalidatePath("/admin");
  revalidatePath("/search");
  return {};
}

export async function adminMarkRequestFulfilledAction(requestId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;

  const { error } = await gate.supabase
    .from("blood_requests")
    .update({ status: "fulfilled" })
    .eq("id", requestId);

  if (error) return { error: "update_failed" };

  revalidatePath("/admin");
  revalidatePath("/requests");
  revalidatePath("/");
  return {};
}

export async function adminDeleteDonorAction(donorId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;

  if (donorId === gate.userId) return { error: "cannot_delete_self" };

  const { error } = await gate.supabase.from("profiles").delete().eq("id", donorId);
  if (error) return { error: "delete_failed" };

  revalidatePath("/admin");
  revalidatePath("/search");
  return {};
}

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
