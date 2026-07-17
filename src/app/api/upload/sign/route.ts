import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUpload, cloudinaryEnabled, type UploadKind } from "@/lib/cloudinary";

export async function POST(request: Request) {
  if (!cloudinaryEnabled) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

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
  const kind = body?.kind as UploadKind | undefined;
  if (kind !== "avatar" && kind !== "testimonial") {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  return NextResponse.json(signUpload(kind));
}
