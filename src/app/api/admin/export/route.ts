import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const COLUMNS: (keyof Profile)[] = [
  "full_name",
  "phone",
  "blood_group",
  "area",
  "last_donation_date",
  "is_available",
  "is_verified",
  "phone_verified",
  "created_at",
];

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: donors } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (donors as Profile[]) ?? [];
  const header = COLUMNS.join(",");
  const body = rows.map((row) => COLUMNS.map((col) => csvEscape(row[col])).join(",")).join("\n");
  const csv = `${header}\n${body}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="savar-blood-donors-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
