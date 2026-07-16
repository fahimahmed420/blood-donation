import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const response = handleI18n(request);
  return updateSession(request, response);
}

// /auth/* (e.g. the OAuth callback) is excluded here — it lives outside the
// [locale] segment. Running it through the i18n router would rewrite it to
// a non-existent /en/auth/callback path and 404 before the OAuth code
// exchange ever runs.
export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
