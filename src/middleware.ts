import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let cachedAnonClient: ReturnType<typeof createClient> | null = null;
function getAnonSupabase(url: string, key: string) {
  if (!cachedAnonClient) {
    cachedAnonClient = createClient(url, key);
  }
  return cachedAnonClient;
}

/**
 * Extracts the tenant subdomain from the incoming request hostname or dev overrides.
 *
 * Supported formats:
 * - Production / Staging: <subdomain>.domain.com -> "<subdomain>"
 * - Local Dev with Wildcard: <subdomain>.localhost:3000 -> "<subdomain>"
 * - Local Dev override (non-production only): ?subdomain=<subdomain> or x-subdomain: <subdomain>
 */
function extractSubdomain(request: NextRequest): string | null {
  // 1. Dev/Testing overrides — STRICTLY gated to non-production environments
  if (process.env.NODE_ENV !== "production") {
    const paramOverride = request.nextUrl.searchParams.get("subdomain");
    if (paramOverride) {
      return paramOverride.toLowerCase().trim();
    }
    const headerOverride = request.headers.get("x-subdomain");
    if (headerOverride) {
      return headerOverride.toLowerCase().trim();
    }
  }

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0]; // Strip port (e.g. "localhost:3000" -> "localhost")

  // 2. Plain IP address or plain "localhost" (no subdomain)
  if (hostname === "localhost" || /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    return null;
  }

  // 3. Local wildcard: <subdomain>.localhost
  if (hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[0]) {
      return parts[0].toLowerCase().trim();
    }
    return null;
  }

  // 4. Vercel preview URLs (e.g. project-git-branch-team.vercel.app)
  // By default, preview deployments do not route wildcard tenant subdomains.
  if (hostname.endsWith(".vercel.app")) {
    return null;
  }

  // 5. Production custom domain (e.g. pinecrest.lodgepro.com)
  const parts = hostname.split(".");
  if (parts.length > 2) {
    const candidate = parts[0].toLowerCase().trim();
    // Ignore reserved / common infrastructure subdomains
    if (candidate !== "www" && candidate !== "app" && candidate !== "api") {
      return candidate;
    }
  }

  return null;
}

function render500Response(title: string, message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>500 - ${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #111827; }
    .card { background: #ffffff; padding: 2.5rem; border-radius: 1rem; border: 1px solid #fed7aa; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); max-width: 440px; text-align: center; }
    .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem 0; font-weight: 700; color: #9a3412; }
    p { font-size: 0.875rem; line-height: 1.5; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">500 Server Error</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`,
    {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}

function render404Response(subdomain: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Lodge Not Found - 404</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #111827; }
    .card { background: #ffffff; padding: 2.5rem; border-radius: 1rem; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); max-width: 440px; text-align: center; }
    .badge { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem 0; font-weight: 700; color: #0b1437; }
    p { font-size: 0.875rem; line-height: 1.5; color: #6b7280; margin: 0 0 1.25rem 0; }
    code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.85rem; color: #1f2937; }
    a { color: #2563eb; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">404 Error</div>
    <h1>Lodge Not Found</h1>
    <p>No lodge is registered under the subdomain <code>${escapeHtml(subdomain)}</code>.</p>
    <p>Please check the URL or contact support.</p>
    <a href="/register">Register a new lodge &rarr;</a>
  </div>
</body>
</html>`,
    {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    }
  );
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const subdomain = extractSubdomain(request);

  // If no subdomain was specified (e.g. hitting localhost:3000/admin or localhost:3000/login):
  // Let updateSession check auth first!
  // - If user is logged in: updateSession redirects them to their own lodge's subdomain (e.g. pinecrest.localhost:3000/admin)
  // - If user is not logged in: updateSession redirects protected routes (/admin, /reception) to /login
  // - If on global route (/register, /install): proceeds cleanly
  if (!subdomain) {
    const cleanHeaders = new Headers(request.headers);
    cleanHeaders.delete('x-lodge-id');
    cleanHeaders.delete('x-lodge-subdomain');
    cleanHeaders.delete('x-lodge-name');
    return await updateSession(request, cleanHeaders);
  }


  // 2. Fail closed if backend configuration is missing (do NOT fall through silently)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("[Middleware] Missing Supabase environment configuration");
    return render500Response(
      "Configuration Error",
      "Tenant resolution is unavailable due to missing backend configuration."
    );
  }

  // 3. Resolve subdomain against lodges table using the unprivileged anon key
  const supabase = getAnonSupabase(supabaseUrl, anonKey);

  let data: any = null;
  let error: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await (supabase.from("lodges") as any)
      .select("id, name, subdomain")
      .eq("subdomain", subdomain)
      .maybeSingle();
    data = res.data;
    error = res.error;
    if (!error) break;
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }

  // Distinguish transient query/network errors from "lodge not found"
  if (error) {
    console.error("[Middleware] Database lookup failure during tenant resolution:", error.message);
    return render500Response(
      "Lookup Failed",
      "An error occurred while resolving the lodge tenant. Please try again shortly."
    );
  }

  const lodge = data as { id: string; name: string; subdomain?: string | null } | null;

  // 4. If no matching lodge exists in database, return explicit 404 (fail closed)
  if (!lodge) {
    return render404Response(subdomain);
  }

  // 5. Attach lodge information using the standard clone-and-pass Headers pattern
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lodge-id", lodge.id);
  requestHeaders.set("x-lodge-subdomain", lodge.subdomain || subdomain);
  requestHeaders.set("x-lodge-name", lodge.name);

  // 6. Compose with Supabase SSR auth session management (cookie refresh & route guards)
  const sessionResponse = await updateSession(request, requestHeaders);

  // Forward lodge identity headers on the returned response as well
  sessionResponse.headers.set("x-lodge-id", lodge.id);
  sessionResponse.headers.set("x-lodge-subdomain", lodge.subdomain || subdomain);
  sessionResponse.headers.set("x-lodge-name", lodge.name);

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files, JS chunks, CSS)
     * - _next/image (image optimization files)
     * - favicon.ico (browser icon)
     * - static assets with extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .woff, .woff2)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
