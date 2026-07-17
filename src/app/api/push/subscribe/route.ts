import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint as string | undefined;
  const p256dh = body?.keys?.p256dh as string | undefined;
  const auth = body?.keys?.auth as string | undefined;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { donor_id: user.id, endpoint, p256dh, auth },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
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

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  await supabase.from("push_subscriptions").delete().eq("donor_id", user.id).eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
