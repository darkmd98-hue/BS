import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database, Profile } from "@/types/database";

export async function updateSession(request: NextRequest, customHeaders?: Headers) {
  const requestHeaders = customHeaders || new Headers(request.headers);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isProtectedRoute = pathname.startsWith("/admin") || pathname.startsWith("/reception");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and hitting protected tenant routes (/admin, /reception),
  // verify they belong to the lodge resolved for this subdomain!
  const targetLodgeId = requestHeaders.get("x-lodge-id");
  if (user && isProtectedRoute && targetLodgeId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, lodge_id")
      .eq("id", user.id)
      .single();

    const profile = profileData as Pick<Profile, "role" | "lodge_id"> | null;

    if (profile && profile.lodge_id !== targetLodgeId) {
      // Cross-tenant mismatch!
      // If client requests JSON (API route), return JSON 403
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: "FORBIDDEN",
            code: 403,
            message: `Cross-tenant mismatch: user does not belong to lodge ${targetLodgeId}`,
          },
          { status: 403 }
        );
      }

      // For page routes, return a clean HTTP 403 HTML page
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>403 - Access Forbidden</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #111827; }
    .card { background: #ffffff; padding: 2.5rem; border-radius: 1rem; border: 1px solid #fed7aa; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); max-width: 440px; text-align: center; }
    .badge { display: inline-block; background: #ffedd5; color: #c2410c; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.75rem 0; font-weight: 700; color: #0b1437; }
    p { font-size: 0.875rem; line-height: 1.5; color: #6b7280; margin: 0 0 1.25rem 0; }
    a { color: #2563eb; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">403 Forbidden</div>
    <h1>Cross-Tenant Access Denied</h1>
    <p>Your account is not authorized to access this lodge. Please switch to your lodge's URL or sign in with an authorized account.</p>
    <a href="/login">Sign in with authorized lodge account &rarr;</a>
  </div>
</body>
</html>`,
        {
          status: 403,
          headers: { "content-type": "text/html; charset=utf-8" },
        }
      );
    }
  }


  if (user && isAuthRoute) {
    // If logged in, fetch user's profile to redirect to proper route group
    const { data } = await supabase
      .from("profiles")
      .select("role, lodge_id")
      .eq("id", user.id)
      .single();

    const profile = data as Pick<Profile, "role" | "lodge_id"> | null;

    if (profile) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === "admin" ? "/admin" : "/reception";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
