import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RequestRow {
  blood_group: string;
  hospital: string;
  needed_by: string;
}

async function fetchRequest(id: string): Promise<RequestRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/blood_requests?id=eq.${id}&select=blood_group,hospital,needed_by`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as RequestRow[];
  return rows[0] ?? null;
}

export default async function OgImage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const request = await fetchRequest(id);
  const isBn = locale === "bn";

  const headline = request
    ? isBn
      ? `জরুরি! ${request.blood_group} রক্ত প্রয়োজন`
      : `Urgent! ${request.blood_group} Blood Needed`
    : isBn
      ? "রক্তের অনুরোধ"
      : "Blood Request";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom, #fef2f2, #ffffff)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "#dc2626",
            color: "#fff",
            fontSize: 56,
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          {request?.blood_group ?? "🩸"}
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#171717" }}>
          {headline}
        </div>
        {request && (
          <div style={{ display: "flex", fontSize: 32, color: "#525252", marginTop: 16 }}>
            {request.hospital}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 28, color: "#dc2626", fontWeight: 700, marginTop: 40 }}>
          {isBn ? "সাভার রক্তদান" : "Savar Blood"}
        </div>
      </div>
    ),
    { ...size }
  );
}
