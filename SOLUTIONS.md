# LodgeOS — Complete Solutions Guide

**Date:** 2026-09-16  
**Total Solutions:** 87  
**Estimated Implementation Time:** 4-6 weeks (prioritized)

---

## CRITICAL FIXES (Implement Immediately - 24 Hours)

### Solution 1: Remove Service Role Key from Git
**Problem:** Service role key exposed in `.env.local`  
**Files:** `.env.local`, `.gitignore`

**Steps:**
1. Remove `.env.local` from git tracking:
   ```bash
   git rm --cached .env.local
   ```

2. Add to `.gitignore`:
   ```
   .env.local
   .env*.local
   *.env
   ```

3. Create `.env.example` template:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. Rotate the exposed service role key in Supabase dashboard immediately

5. Store production keys in environment variable service (Vercel/Railway env vars)

**Verification:**
```bash
git log --all --full-history -- .env.local  # Should show removal
grep -r "eyJ" .  # Should find no hardcoded keys
```

---

### Solution 2: Add Payment Webhook Signature Verification
**Problem:** No signature verification on payment webhook  
**File:** `src/app/api/webhooks/payments/route.ts`

**Steps:**
1. Install signature verification libraries:
   ```bash
   npm install stripe@latest razorpay@latest
   ```

2. Replace the POST handler:
   ```typescript
   import Stripe from 'stripe';
   import Razorpay from 'razorpay';
   
   export async function POST(request: NextRequest) {
     const signature = request.headers.get("stripe-signature") || 
                       request.headers.get("x-razorpay-signature");
     const rawBody = await request.text();
     
     if (!signature) {
       return NextResponse.json({ error: "Missing signature" }, { status: 401 });
     }
   
     // Determine gateway from signature header
     const isStripe = request.headers.has("stripe-signature");
     const adminSupabase = createAdminClient();
     
     // Get webhook secret from database
     const { data: gatewayConfig } = await (adminSupabase as any)
       .from("lodge_payment_gateways")
       .select("webhook_secret, lodge_id")
       .eq("gateway_name", isStripe ? "stripe" : "razorpay")
       .single();
     
     if (!gatewayConfig?.webhook_secret) {
       return NextResponse.json({ error: "Gateway not configured" }, { status: 400 });
     }
   
     let event;
     try {
       if (isStripe) {
         const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
           apiVersion: "2024-11-20.acacia",
         });
         event = stripe.webhooks.constructEvent(
           rawBody,
           signature,
           gatewayConfig.webhook_secret
         );
       } else {
         // Razorpay signature verification
         const crypto = require("crypto");
         const expectedSignature = crypto
           .createHmac("sha256", gatewayConfig.webhook_secret)
           .update(rawBody)
           .digest("hex");
         
         if (signature !== expectedSignature) {
           throw new Error("Invalid signature");
         }
         event = JSON.parse(rawBody);
       }
     } catch (err: any) {
       console.error("Webhook signature verification failed:", err.message);
       return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
     }
   
     // Continue with existing webhook processing logic...
     const lodgeId = gatewayConfig.lodge_id;
     // ... rest of handler
   }
   ```

3. Update Next.js config to disable body parsing for webhook route:
   ```typescript
   // src/app/api/webhooks/payments/route.ts
   export const config = {
     api: {
       bodyParser: false, // Required for Stripe signature verification
     },
   };
   ```

**Verification:**
```bash
# Test with invalid signature (should fail)
curl -X POST http://localhost:3000/api/webhooks/payments \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}' 
# Expected: 401 "Missing signature"
```

---

### Solution 3: Add Rate Limiting on Authentication
**Problem:** No rate limiting on login/registration  
**Files:** `src/middleware.ts`, `package.json`

**Steps:**
1. Install rate limiting library:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. Create rate limiter utility:
   ```typescript
   // src/lib/rate-limit.ts
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   
   const redis = new Redis({
     url: process.env.UPSTASH_REDIS_REST_URL!,
     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
   });
   
   export const authLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
     prefix: "lodgeos:auth:",
   });
   
   export const registrationLimiter = new Ratelimit({
     redis,
     limiter: Ratelimit.fixedWindow(3, "1 h"), // 3 registrations per hour per IP
     prefix: "lodgeos:register:",
   });
   ```

3. Update registration action:
   ```typescript
   // src/app/actions/auth.ts
   import { registrationLimiter } from "@/lib/rate-limit";
   import { headers } from "next/headers";
   
   export async function registerLodgeAction(formData: FormData) {
     const headersList = await headers();
     const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
     
     const { success, limit, remaining, reset } = await registrationLimiter.limit(ip);
     
     if (!success) {
       return {
         success: false,
         message: `Too many registration attempts. Try again in ${Math.ceil((reset - Date.now()) / 60000)} minutes.`,
       };
     }
     
     // ... existing registration logic
   }
   ```

4. Update login form to check rate limit:
   ```typescript
   // src/components/auth/StaffLoginForm.tsx
   import { authLimiter } from "@/lib/rate-limit";
   
   async function handleLogin(e: React.FormEvent) {
     e.preventDefault();
     
     const ip = // get from headers
     const { success } = await authLimiter.limit(ip);
     
     if (!success) {
       setError("Too many login attempts. Please wait 15 minutes.");
       return;
     }
     
     // ... existing login logic
   }
   ```

5. Add environment variables to `.env.example`:
   ```
   UPSTASH_REDIS_REST_URL=your-upstash-url
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   ```

**Verification:**
```bash
# Attempt 6 logins rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' 
done
# 6th request should return rate limit error
```

---

### Solution 5: Enforce HTTPS in Production
**Problem:** No HTTPS enforcement  
**Files:** `src/middleware.ts`, `.env.local`

**Steps:**
1. Add HTTPS redirect in middleware:
   ```typescript
   // src/middleware.ts (add at top of middleware function)
   export async function middleware(request: NextRequest) {
     // Force HTTPS in production
     if (
       process.env.NODE_ENV === "production" &&
       request.headers.get("x-forwarded-proto") !== "https"
     ) {
       const url = request.nextUrl.clone();
       url.protocol = "https:";
       return NextResponse.redirect(url, 301);
     }
     
     // ... existing middleware logic
   }
   ```

2. Update `.env.example`:
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. Add security headers:
   ```typescript
   // next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: "/:path*",
           headers: [
             {
               key: "Strict-Transport-Security",
               value: "max-age=63072000; includeSubDomains; preload",
             },
           ],
         },
       ];
     },
   };
   ```

**Verification:**
```bash
curl -I https://yourdomain.com | grep -i "strict-transport"
# Should see HSTS header
```

---

### Solution 6: Fix RLS Helper to Throw Instead of Return NULL
**Problem:** `get_auth_lodge_id()` returns NULL, potentially bypassing RLS  
**File:** `supabase/migrations/20260822000000_init_lodges_and_profiles.sql`

**Steps:**
1. Create new migration:
   ```sql
   -- supabase/migrations/20260917000000_fix_get_auth_lodge_id.sql
   
   -- Drop old function
   drop function if exists public.get_auth_lodge_id();
   
   -- Recreate with exception on NULL
   create or replace function public.get_auth_lodge_id()
   returns uuid
   language sql
   security definer
   stable
   as $$
     select coalesce(
       (select lodge_id from public.profiles where id = auth.uid()),
       (select raise_exception('No lodge_id found for authenticated user. User must have a profile.'::text)::uuid)
     );
   $$;
   
   -- Helper function to raise exceptions
   create or replace function raise_exception(msg text)
   returns void
   language plpgsql
   as $$
   begin
     raise exception '%', msg;
   end;
   $$;
   ```

2. Apply migration:
   ```bash
   npx supabase db push
   ```

3. Test with user without profile:
   ```sql
   -- Should throw error, not return NULL
   select get_auth_lodge_id();
   ```

**Verification:**
```bash
# Create test user without profile, attempt query
# Expected: "No lodge_id found for authenticated user" error
```

---

### Solution 9: Set Secure Cookie Flags
**Problem:** Session cookies lack httpOnly/secure flags  
**File:** `src/lib/supabase/server.ts`

**Steps:**
1. Replace cookie configuration:
   ```typescript
   // src/lib/supabase/server.ts
   export async function createClient() {
     const cookieStore = await cookies();
   
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, {
                   ...options,
                   httpOnly: true,
                   secure: process.env.NODE_ENV === "production",
                   sameSite: "lax",
                   path: "/",
                 })
               );
             } catch (error) {
               // Server Component - can't set cookies
             }
           },
         },
       }
     );
   }
   ```

**Verification:**
```bash
# Check cookie flags in browser DevTools > Application > Cookies
# All Supabase cookies should have HttpOnly, Secure (in prod), SameSite=Lax
```

---

### Solution 11: Remove Subdomain Override in Production
**Problem:** `?subdomain=` query param bypass possible  
**File:** `src/middleware.ts`

**Steps:**
1. Strengthen environment check:
   ```typescript
   // src/middleware.ts:30-42
   function extractSubdomain(request: NextRequest): string | null {
     const url = request.nextUrl;
     
     // REMOVED: Query param override entirely
     // Even in development, use proper subdomain testing via /etc/hosts
     
     const hostname = request.headers.get("host") || url.hostname;
     const parts = hostname.split(".");
     
     // localhost:3000 → null
     if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
       return null;
     }
     
     // subdomain.domain.com → "subdomain"
     if (parts.length >= 3) {
       return parts[0];
     }
     
     return null;
   }
   ```

2. For local development, use `/etc/hosts`:
   ```bash
   # /etc/hosts (Windows: C:\Windows\System32\drivers\etc\hosts)
   127.0.0.1 testlodge.localhost
   127.0.0.1 pinecrest.localhost
   ```

**Verification:**
```bash
# This should NOT work in any environment
curl "http://localhost:3000?subdomain=victim"
# Expected: No subdomain resolution
```

---

### Solution 12: Configure Database Connection Pooling
**Problem:** No connection pooling, exhausts PostgreSQL connections  
**Files:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

**Steps:**
1. Use singleton pattern for server client:
   ```typescript
   // src/lib/supabase/server.ts
   import { createServerClient as _createServerClient } from "@supabase/ssr";
   import { cookies } from "next/headers";
   
   let serverClientInstance: ReturnType<typeof _createServerClient> | null = null;
   
   export async function createClient() {
     // Reuse existing client in serverless function instance
     if (serverClientInstance) {
       return serverClientInstance;
     }
     
     const cookieStore = await cookies();
     
     serverClientInstance = _createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll: () => cookieStore.getAll(),
           setAll: (cookiesToSet) => {
             cookiesToSet.forEach(({ name, value, options }) =>
               cookieStore.set(name, value, {
                 ...options,
                 httpOnly: true,
                 secure: process.env.NODE_ENV === "production",
                 sameSite: "lax",
               })
             );
           },
         },
       }
     );
     
     return serverClientInstance;
   }
   ```

2. Configure Supabase connection pooling in dashboard:
   - Go to Supabase Dashboard → Settings → Database
   - Enable Connection Pooler (port 6543)
   - Set pool mode to "Transaction"
   - Update connection string:
     ```
     SUPABASE_DB_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
     ```

3. For high traffic, use Supavisor (Supabase's built-in pooler) or external PgBouncer

**Verification:**
```bash
# Monitor active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres';"
# Should stay under 20 even with 100+ concurrent requests
```

---

---

## HIGH SEVERITY FIXES (Implement Within 1 Week)

### Solution 4: Rate Limit Registration with IP Fingerprinting
**Problem:** No rate limiting on lodge registration action  
**File:** `src/app/actions/auth.ts`

**Steps:**
1. Add IP extraction and check at the top of `registerLodgeAction` (after the rate-limit lib is installed per Solution 3):
   ```typescript
   // src/app/actions/auth.ts  (add to top of registerLodgeAction)
   import { registrationLimiter } from "@/lib/rate-limit";
   import { headers } from "next/headers";

   export async function registerLodgeAction(formData: FormData) {
     const headersList = await headers();
     const forwarded = headersList.get("x-forwarded-for");
     const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

     const { success, reset } = await registrationLimiter.limit(ip);
     if (!success) {
       const waitMin = Math.ceil((reset - Date.now()) / 60000);
       return { success: false, message: `Too many registrations from this IP. Try again in ${waitMin} minute(s).` };
     }

     // ... rest of existing registration logic unchanged
   }
   ```

**Verification:**
```bash
for i in {1..4}; do
  curl -s -X POST http://localhost:3000/api/register -d "..." | jq .message
done
# 4th response: "Too many registrations..."
```

---

### Solution 7: Sanitize User Input Against Stored XSS
**Problem:** Customer name / special_request fields stored raw, renderable as scripts  
**Files:** `src/app/reception/reservations/new/page.tsx`, all components that render customer data

**Steps:**
1. Install DOMPurify for server-side use:
   ```bash
   npm install isomorphic-dompurify
   ```

2. Create a shared sanitiser:
   ```typescript
   // src/lib/sanitize.ts
   import DOMPurify from "isomorphic-dompurify";

   /** Strip all HTML/script from user-supplied strings. */
   export function sanitizeText(value: unknown): string {
     if (typeof value !== "string") return "";
     return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
   }
   ```

3. Apply at every point where FormData values are read before DB insert:
   ```typescript
   // src/app/reception/reservations/new/page.tsx
   import { sanitizeText } from "@/lib/sanitize";

   const name          = sanitizeText(formData.get("name"));
   const mobile        = sanitizeText(formData.get("mobile"));
   const email         = sanitizeText(formData.get("email"));
   const specialReq    = sanitizeText(formData.get("special_request"));
   const roomNumber    = sanitizeText(formData.get("room_number"));
   ```

4. Also apply in `createRoomAction` for room_number / floor / notes fields.

**Verification:**
```bash
# POST a reservation with name = '<script>alert(1)</script>'
# Then visit customer list — should show literal text, no alert
```

---

### Solution 8: Add CORS Origin Validation to Webhook Endpoint
**Problem:** No CORS protection; any origin can POST to webhook  
**File:** `src/app/api/webhooks/payments/route.ts`

**Steps:**
1. Restrict allowed origins at the route level:
   ```typescript
   // src/app/api/webhooks/payments/route.ts

   const ALLOWED_ORIGINS = new Set([
     "https://api.stripe.com",
     "https://api.razorpay.com",
   ]);

   function corsHeaders(origin: string | null): HeadersInit {
     if (origin && ALLOWED_ORIGINS.has(origin)) {
       return { "Access-Control-Allow-Origin": origin };
     }
     return {}; // deny cross-origin preflight
   }

   export async function OPTIONS(request: NextRequest) {
     const origin = request.headers.get("origin");
     return new NextResponse(null, {
       status: 204,
       headers: corsHeaders(origin),
     });
   }

   export async function POST(request: NextRequest) {
     // Signature check (Solution 2) handles the real security.
     // CORS header added for completeness.
     const origin = request.headers.get("origin");
     // ... existing handler code ...
     return NextResponse.json(
       { received: true },
       { headers: corsHeaders(origin) }
     );
   }
   ```

**Verification:**
```bash
curl -X OPTIONS http://localhost:3000/api/webhooks/payments \
  -H "Origin: https://evil.com" -v
# Should NOT return Access-Control-Allow-Origin header
```

---

### Solution 10: Remove Hardcoded Demo Credentials from payments-gateway.ts
**Problem:** Fake Stripe/Razorpay API keys committed to source code  
**File:** `src/lib/payments-gateway.ts:93-109`

**Steps:**
1. Remove hardcoded defaults entirely — show empty strings:
   ```typescript
   // src/lib/payments-gateway.ts:89-109  REPLACE with:
   const defaultStripe: PaymentGatewayConfig = {
     lodge_id: lodgeId,
     gateway_name: "stripe",
     is_enabled: false,
     publishable_key: "",
     secret_key: "",
     webhook_secret: "",
     currency: "INR",
     is_test_mode: true,
   };

   const defaultRazorpay: PaymentGatewayConfig = {
     lodge_id: lodgeId,
     gateway_name: "razorpay",
     is_enabled: false,
     publishable_key: "",
     secret_key: "",
     webhook_secret: "",
     currency: "INR",
     is_test_mode: true,
   };
   ```

2. Update the UI to show a "Configure gateway" CTA when keys are empty instead of rendering a broken state:
   ```tsx
   // In the Stripe/Razorpay settings card component
   {gateway.publishable_key === "" && (
     <p className="text-yellow-600 text-sm">
       Gateway not yet configured. Add your API keys below.
     </p>
   )}
   ```

**Verification:**
```bash
grep -r "pk_test_51Mz\|rzp_test_Demo\|sk_test_••\|whsec_mock" src/
# Expected: 0 matches
```

---

### Solution 13: Fail Middleware Closed on Database Error
**Problem:** Middleware returns 500 but protected routes still accessed on error  
**File:** `src/middleware.ts`

**Steps:**
1. Wrap entire middleware in try/catch and return 503 on any failure before passing:
   ```typescript
   export async function middleware(request: NextRequest) {
     // HTTPS redirect first (Solution 5)
     if (
       process.env.NODE_ENV === "production" &&
       request.headers.get("x-forwarded-proto") !== "https"
     ) {
       const httpsUrl = request.nextUrl.clone();
       httpsUrl.protocol = "https:";
       return NextResponse.redirect(httpsUrl, 301);
     }

     try {
       const subdomain = extractSubdomain(request);

       if (!subdomain) {
         return NextResponse.next(); // marketing / landing page
       }

       // ... lodge lookup logic ...

       if (error || !lodge) {
         // Unknown subdomain → 404, not the app
         return new NextResponse("Lodge not found", { status: 404 });
       }

       const response = NextResponse.next();
       response.headers.set("x-lodge-id", lodge.id);
       response.headers.set("x-lodge-subdomain", lodge.subdomain);
       response.headers.set("x-lodge-name", lodge.name);
       return response;

     } catch (err: any) {
       console.error("[Middleware] Fatal error:", err.message);
       // Fail CLOSED — never pass an unauthenticated request through
       return new NextResponse(
         JSON.stringify({ error: "Service temporarily unavailable" }),
         { status: 503, headers: { "Content-Type": "application/json" } }
       );
     }
   }
   ```

**Verification:**
```bash
# Kill Supabase locally, hit a protected route
curl -I http://pinecrest.localhost:3000/reception
# Expected: 503, not 200
```

---

### Solution 14: Enforce Minimum 8-Character Password with Complexity
**Problem:** 6-character passwords accepted  
**File:** `src/app/actions/auth.ts`

**Steps:**
1. Replace the existing length check:
   ```typescript
   // src/app/actions/auth.ts — replace password validation block
   const password = formData.get("password") as string;

   if (password.length < 8) {
     return { success: false, message: "Password must be at least 8 characters." };
   }
   if (!/[A-Z]/.test(password)) {
     return { success: false, message: "Password must contain at least one uppercase letter." };
   }
   if (!/[0-9]/.test(password)) {
     return { success: false, message: "Password must contain at least one number." };
   }
   ```

2. Show live strength hints in the registration form:
   ```tsx
   // src/components/auth/RegistrationForm.tsx — add below password input
   <ul className="text-xs mt-1 space-y-0.5 text-gray-500">
     <li className={password.length >= 8 ? "text-green-600" : ""}>✓ At least 8 characters</li>
     <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>✓ One uppercase letter</li>
     <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>✓ One number</li>
   </ul>
   ```

**Verification:**
```bash
curl -X POST http://localhost:3000/api/register -d "password=weak" | jq .message
# Expected: "Password must be at least 8 characters."
```

---

### Solution 15: Harden Server Actions Against CSRF
**Problem:** Server actions expose state-mutation without origin validation  
**File:** `next.config.js`

**Steps:**
1. Lock `allowedOrigins` in Next.js config:
   ```typescript
   // next.config.js (or next.config.mjs)
   const nextConfig = {
     experimental: {
       serverActions: {
         allowedOrigins: [
           "localhost:3000",
           "yourdomain.com",
           "*.yourdomain.com",
         ],
       },
     },
   };
   module.exports = nextConfig;
   ```

2. For direct API routes (not server actions), add origin check:
   ```typescript
   // src/lib/guard-origin.ts
   import { NextRequest, NextResponse } from "next/server";

   const ALLOWED = new Set([
     process.env.NEXT_PUBLIC_APP_URL,
     "http://localhost:3000",
   ].filter(Boolean));

   export function requireSameOrigin(request: NextRequest): NextResponse | null {
     const origin = request.headers.get("origin");
     if (!origin) return null; // server-to-server, fine
     if (ALLOWED.has(origin)) return null;
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }
   ```

3. Apply in any internal API route that changes data:
   ```typescript
   // src/app/api/some-route/route.ts
   import { requireSameOrigin } from "@/lib/guard-origin";

   export async function POST(request: NextRequest) {
     const rejected = requireSameOrigin(request);
     if (rejected) return rejected;
     // ... handler
   }
   ```

**Verification:**
```bash
curl -X POST http://localhost:3000/_next/action -H "Origin: https://evil.com"
# Expected: 403 or next.js framework level rejection
```

---

### Solution 16: Validate Email With a Proper Library
**Problem:** Homemade regex accepts invalid emails  
**File:** `src/app/actions/auth.ts`

**Steps:**
1. Use the validator package (already common in Node ecosystems):
   ```bash
   npm install validator
   npm install -D @types/validator
   ```

2. Replace regex:
   ```typescript
   // src/app/actions/auth.ts
   import isEmail from "validator/lib/isEmail";

   const email = (formData.get("email") as string).trim().toLowerCase();
   if (!isEmail(email)) {
     return { success: false, message: "Please enter a valid email address." };
   }
   ```

**Verification:**
```bash
# Test edge cases
node -e "const v = require('validator'); console.log(v.isEmail('test@localhost'))" 
# false — caught
```

---

### Solution 17: Create Password Reset Flow
**Problem:** No password reset mechanism exists  
**Files:** New route + action

**Steps:**
1. Supabase handles token generation — just call the API:
   ```typescript
   // src/app/actions/auth.ts — add new action
   export async function requestPasswordResetAction(formData: FormData) {
     const email = (formData.get("email") as string).trim().toLowerCase();
     if (!email) return { success: false, message: "Email required." };

     const supabase = await createClient();
     const { error } = await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
     });

     // Always return success to prevent email enumeration
     return { success: true, message: "If that email exists, a reset link has been sent." };
   }
   ```

2. Create the reset page:
   ```tsx
   // src/app/auth/reset-password/page.tsx
   "use client";
   import { useState } from "react";
   import { createClient } from "@/lib/supabase/client";
   import { useRouter } from "next/navigation";

   export default function ResetPasswordPage() {
     const [password, setPassword] = useState("");
     const [error, setError] = useState("");
     const router = useRouter();

     async function handleReset(e: React.FormEvent) {
       e.preventDefault();
       if (password.length < 8) { setError("Minimum 8 characters."); return; }
       const supabase = createClient();
       const { error } = await supabase.auth.updateUser({ password });
       if (error) { setError(error.message); return; }
       router.push("/reception");
     }

     return (
       <form onSubmit={handleReset}>
         <label htmlFor="password">New password</label>
         <input id="password" type="password" value={password}
           onChange={e => setPassword(e.target.value)} required />
         {error && <p role="alert" className="text-red-600">{error}</p>}
         <button type="submit">Update password</button>
       </form>
     );
   }
   ```

**Verification:**
```bash
# Request reset for existing email, check email arrives
# Click link, set new password, verify login works
```

---

### Solution 18: Handle JWT Expiration Gracefully
**Problem:** Expired tokens cause silent failures without redirect  
**File:** `src/lib/tenant.ts`

**Steps:**
1. Check session expiry and refresh before proceeding:
   ```typescript
   // src/lib/tenant.ts — at top of getTenantContext()
   const supabase = await createClient();

   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
   if (!session || sessionError) {
     redirect("/auth/login?reason=no_session");
   }

   const nowSec = Math.floor(Date.now() / 1000);
   if ((session.expires_at ?? 0) - nowSec < 60) {
     const { error: refreshError } = await supabase.auth.refreshSession();
     if (refreshError) redirect("/auth/login?reason=session_expired");
   }
   ```

**Verification:**
```bash
# Manually expire token (set short TTL in Supabase dashboard for testing)
# Visit protected page → should redirect to /auth/login?reason=session_expired
```

---

### Solution 19: Prevent Double-Booking with Exclusion Constraint
**Problem:** Race condition allows two reservations for same room/dates  
**File:** New migration

**Steps:**
1. Enable btree_gist and add exclusion constraint:
   ```sql
   -- supabase/migrations/20260917000001_reservation_no_overlap.sql
   create extension if not exists btree_gist;

   alter table public.reservations
     add constraint reservations_room_dates_no_overlap
     exclude using gist (
       lodge_id  with =,
       room_id   with =,
       daterange(check_in, check_out, '[)') with &&
     )
     where (status not in ('cancelled', 'checked_out'));
   ```

2. Handle the constraint violation (error code `23P01`) in the action:
   ```typescript
   // src/app/reception/reservations/new/page.tsx
   if (error?.code === "23P01") {
     return { success: false, message: "Room is already booked for those dates. Choose different dates or another room." };
   }
   ```

**Verification:**
```bash
# Insert two reservations for same room/dates simultaneously
# Second insert should fail with unique exclusion violation
```

---

### Solution 20: Enforce Unique Subdomain at DB Level
**Problem:** Two lodges could claim the same subdomain  
**File:** New migration

**Steps:**
1. Create migration:
   ```sql
   -- supabase/migrations/20260917000002_enforce_subdomain_unique.sql

   -- Guard against existing duplicates before adding constraint
   do $$ begin
     if exists (
       select subdomain from public.lodges
       where subdomain is not null
       group by subdomain having count(*) > 1
     ) then
       raise exception 'Duplicate subdomains detected — resolve before applying constraint';
     end if;
   end $$;

   -- Drop old partial index
   drop index if exists idx_lodges_subdomain_unique;

   -- Full unique constraint (NULL values are not equal in SQL, so two NULL rows are fine)
   create unique index if not exists idx_lodges_subdomain_unique
     on public.lodges(subdomain)
     where subdomain is not null;
   ```

2. Check subdomain availability before insert in registration:
   ```typescript
   // src/app/actions/auth.ts — before calling create_new_lodge_tenant RPC
   const { data: taken } = await adminSupabase
     .from("lodges")
     .select("id")
     .eq("subdomain", subdomain)
     .maybeSingle();

   if (taken) {
     return { success: false, message: "Subdomain already taken. Choose another." };
   }
   ```

**Verification:**
```bash
# Register two lodges with same subdomain
# Second registration: "Subdomain already taken"
```

---

### Solution 21: Cap Middleware Retry Count and Add Circuit Breaker
**Problem:** 3 retries × every request = 4× DB load; cascade risk  
**File:** `src/middleware.ts`

**Steps:**
1. Reduce retries and add jitter:
   ```typescript
   // src/middleware.ts — replace the retry block
   const MAX_RETRIES = 1; // was 3 — one retry is enough
   const BASE_DELAY_MS = 100;

   async function lookupLodge(subdomain: string) {
     for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
       const { data, error } = await supabase
         .from("lodges")
         .select("id, name, subdomain")
         .eq("subdomain", subdomain)
         .single();

       if (!error) return data;
       if (attempt < MAX_RETRIES) {
         await new Promise(r => setTimeout(r, BASE_DELAY_MS + Math.random() * 50));
       }
     }
     return null;
   }
   ```

**Verification:**
```bash
# Throttle Supabase responses to simulate slowness
# Page should fail fast (≤ 250ms) rather than waiting 900ms
```

---

### Solution 22: Soft-Delete Lodges Instead of Cascade-Deleting Profiles
**Problem:** Deleting a lodge destroys all staff profiles and auth entries  
**File:** New migration + lodge deletion logic

**Steps:**
1. Add `deleted_at` column:
   ```sql
   -- supabase/migrations/20260917000003_soft_delete_lodges.sql
   alter table public.lodges add column if not exists deleted_at timestamptz;

   -- Update RLS to exclude deleted lodges from normal queries
   create or replace policy "lodges_select_active"
     on public.lodges for select
     using (deleted_at is null);
   ```

2. Replace any hard delete of lodges with a soft delete:
   ```typescript
   await supabase.from("lodges").update({ deleted_at: new Date().toISOString() }).eq("id", lodgeId);
   ```

**Verification:**
```bash
# Soft-delete a lodge, verify staff profiles still exist in DB
# Verify lodge no longer appears in normal queries
```

---

### Solution 23: Wrap Reservation + Room Status Update in RPC
**Problem:** Room status update is a separate query; can leave room "available" after reservation  
**File:** New migration (builds on Solution 40)

**Steps:**  
All room-status writes should go through the `create_reservation_with_bill` RPC introduced in Solution 40, which updates `rooms.status = 'reserved'` inside the same transaction. Once that RPC is in place, remove the standalone room-status update from the TypeScript action.

```typescript
// Remove this from reservations/new/page.tsx:
// await supabase.from("rooms").update({ status: "reserved" }).eq("id", roomId);
// It now happens atomically inside the RPC.
```

**Verification:**
```bash
# Kill DB connection after reservation insert but before room update (simulate with breakpoint)
# Room should still be marked reserved (because it's in the same transaction)
```

---

### Solution 24: Use BigInt / Decimal for Bill Arithmetic
**Problem:** JavaScript number loses precision for large rent×nights  
**File:** `src/app/reception/reservations/new/page.tsx`

**Steps:**
1. Do all money math in the database (already integers in paise), not JavaScript:
   ```typescript
   // Pass raw numbers to the RPC — let PostgreSQL numeric handle it
   // DO NOT multiply in JS:
   // BAD:  const net = rent * nights;  // float risk
   // GOOD: let the DB calculate net_amount = p_rent * p_nights inside the RPC
   ```

2. Where front-end display math is unavoidable, use integer paise throughout:
   ```typescript
   // src/lib/currency.ts — store and pass amounts as integer paise
   export const toPaise   = (rupees: number) => Math.round(rupees * 100);
   export const toRupees  = (paise: number)  => paise / 100;
   ```

**Verification:**
```bash
node -e "console.log(50000 * 365)"   # 18250000 — safe
node -e "console.log(50000 * 365 * 100)"  # 1825000000 — still safe (< 2^53)
# Confirm DB numeric column used for all final calculations
```

---

### Solution 25: Paginate All List Queries
**Problem:** Full-table fetches grow linearly with data  
**Files:** `src/app/reception/page.tsx`, `src/app/reception/billing/page.tsx`, others

**Steps:**
1. Add `PAGE_SIZE` constant and `.range()` to every list query:
   ```typescript
   // src/app/reception/page.tsx
   const PAGE_SIZE = 50;
   const page = 0; // accept via searchParam: Number(searchParams?.page ?? 0)

   const { data: reservations } = await supabase
     .from("reservations")
     .select("id, room_id, customer_id, check_in, check_out, status")
     .eq("lodge_id", lodgeId)
     .order("check_in", { ascending: false })
     .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
   ```

2. Pass `page` prop to a `<Pagination>` component:
   ```tsx
   // src/components/shared/Pagination.tsx
   export function Pagination({ page, hasMore, basePath }: { page: number; hasMore: boolean; basePath: string }) {
     return (
       <div className="flex gap-4 mt-4">
         {page > 0 && <a href={`${basePath}?page=${page - 1}`}>← Previous</a>}
         {hasMore && <a href={`${basePath}?page=${page + 1}`}>Next →</a>}
       </div>
     );
   }
   ```

**Verification:**
```bash
# Insert 200 test reservations, load /reception
# Network tab: query should show range header, fetch max 50 rows
```

---

### Solution 26: Add Missing Database Indexes
**Problem:** Sequential scans on high-traffic columns  
**File:** New migration

**Steps:**
```sql
-- supabase/migrations/20260917000004_add_perf_indexes.sql

-- Reservations: date-range and status used on every dashboard load
create index if not exists idx_reservations_checkin_status
  on public.reservations(lodge_id, check_in, status);

create index if not exists idx_reservations_checkout_status
  on public.reservations(lodge_id, check_out, status);

-- Rooms: status filter (available / occupied)
create index if not exists idx_rooms_status
  on public.rooms(lodge_id, status);

-- Bills: payment_status for outstanding balance queries
create index if not exists idx_bills_payment_status
  on public.bills(lodge_id, payment_status);

-- Payments: time-series reporting
create index if not exists idx_payments_paid_at
  on public.payments(lodge_id, paid_at desc);

-- Customers: lookup by mobile / email
create index if not exists idx_customers_mobile
  on public.customers(lodge_id, mobile);

create index if not exists idx_customers_email
  on public.customers(lodge_id, email);

analyze public.reservations, public.rooms, public.bills, public.payments, public.customers;
```

**Verification:**
```sql
explain analyze
  select * from reservations
  where lodge_id = 'xxx' and status = 'confirmed' and check_in = '2026-09-16';
-- "Index Scan" not "Seq Scan"
```

---

### Solution 27: Add Idempotency Key Check on Webhooks
**Problem:** Stripe/Razorpay retries processed twice → duplicate payment records  
**File:** `src/app/api/webhooks/payments/route.ts`

**Steps:**
1. Check for duplicate `event_id` before processing:
   ```typescript
   // src/app/api/webhooks/payments/route.ts — after gateway detection
   const { data: existing } = await (adminSupabase as any)
     .from("payment_gateway_webhooks")
     .select("id")
     .eq("event_id", eventId)
     .eq("lodge_id", lodgeId)
     .maybeSingle();

   if (existing) {
     // Already processed — return 200 to stop Stripe/Razorpay from retrying
     return NextResponse.json({ received: true, duplicate: true });
   }
   ```

**Verification:**
```bash
# Send same webhook event_id twice
# Second: response body contains "duplicate: true", no new payment row
```

---

### Solution 28: Track Refunds Per Payment from Day One
**Problem:** Payments before the `refund_status` migration have no refund record  
**File:** New migration

**Steps:**
1. Backfill `refund_status = null` explicitly and add NOT NULL default:
   ```sql
   -- supabase/migrations/20260917000005_backfill_refund_status.sql
   update public.payments set refund_status = null where refund_status is null;
   -- Column already allows NULL; this makes intent explicit in history.

   -- Also add check constraint for valid values
   alter table public.payments
     add constraint payments_refund_status_check
     check (refund_status in ('pending', 'refunded', 'partial') or refund_status is null);
   ```

2. Add a `refund_at` timestamp column for audit trail:
   ```sql
   alter table public.payments
     add column if not exists refunded_at timestamptz;
   ```

**Verification:**
```sql
select count(*) from payments where refund_status not in ('pending','refunded','partial') and refund_status is not null;
-- Should be 0
```

---

### Solution 29: Add Audit Log Retention Policy
**Problem:** Audit log table grows unbounded  
**File:** New migration

**Steps:**
1. Add `created_at` index and scheduled purge function:
   ```sql
   -- supabase/migrations/20260917000006_audit_log_retention.sql

   create index if not exists idx_audit_log_created_at
     on public.audit_log(lodge_id, created_at desc);

   -- Retention function: keep 90 days, callable from pg_cron or cron job
   create or replace function public.purge_old_audit_logs()
   returns void language sql security definer as $$
     delete from public.audit_log
     where created_at < now() - interval '90 days';
   $$;
   ```

2. Schedule daily purge via Supabase pg_cron (enable in dashboard → Extensions):
   ```sql
   select cron.schedule('purge-audit-logs', '0 3 * * *', 'select public.purge_old_audit_logs()');
   ```

**Verification:**
```sql
select count(*) from audit_log where created_at < now() - interval '90 days';
-- After first run: 0
```

---

### Solution 30: Normalise Reservation Status to Consistent Enum
**Problem:** Code mixes "checked_in" and "checked-in" (dash vs underscore)  
**Files:** New migration + all TypeScript status references

**Steps:**
1. Enforce enum at database level:
   ```sql
   -- supabase/migrations/20260917000007_reservation_status_enum.sql
   alter table public.reservations
     add constraint reservations_status_check
     check (status in ('confirmed','checked_in','checked_out','cancelled','no_show'));

   -- Fix any existing dash-format rows
   update public.reservations set status = 'checked_in'  where status = 'checked-in';
   update public.reservations set status = 'checked_out' where status = 'checked-out';
   ```

2. In TypeScript, use a const enum:
   ```typescript
   // src/types/database.ts
   export const RESERVATION_STATUS = {
     CONFIRMED:    "confirmed",
     CHECKED_IN:   "checked_in",
     CHECKED_OUT:  "checked_out",
     CANCELLED:    "cancelled",
     NO_SHOW:      "no_show",
   } as const;
   export type ReservationStatus = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS];
   ```

3. Replace all string literals with the const:
   ```typescript
   .eq("status", RESERVATION_STATUS.CHECKED_IN)
   ```

**Verification:**
```sql
select distinct status from reservations;
-- Only values from the allowed set
```

---

### Solution 31: Validate and Normalise Mobile Numbers
**Problem:** Same customer stored multiple times with different mobile formats  
**File:** `src/app/reception/reservations/new/page.tsx`

**Steps:**
1. Normalise mobile to digits only on input:
   ```typescript
   // src/lib/sanitize.ts — add
   export function normaliseMobile(raw: string): string {
     const digits = raw.replace(/\D/g, "");
     // Indian mobile: strip leading 91 or 0
     if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
     if (digits.startsWith("0")  && digits.length === 11) return digits.slice(1);
     return digits;
   }
   ```

2. Validate length before insert:
   ```typescript
   const mobile = normaliseMobile(formData.get("mobile") as string);
   if (mobile.length !== 10) {
     return { success: false, message: "Please enter a valid 10-digit mobile number." };
   }
   ```

**Verification:**
```bash
# Input "+91 98765 43210" and "9876543210" for same customer
# Both should map to "9876543210" and hit the same customer record
```

---

### Solution 32: Replace Console.error with Structured Logging (No Data Leak)
**Problem:** `console.error(error.message)` leaks internal schema info  
**Files:** `src/middleware.ts`, all routes

**Steps:**
1. Create a minimal logger that redacts in production:
   ```typescript
   // src/lib/logger.ts
   const IS_PROD = process.env.NODE_ENV === "production";

   export const logger = {
     error: (msg: string, err?: unknown) => {
       if (IS_PROD) {
         // Write only a sanitised error code — no raw message in prod logs
         console.error(msg, err instanceof Error ? err.name : "UnknownError");
       } else {
         console.error(msg, err);
       }
     },
     warn:  (msg: string) => console.warn(msg),
     info:  (msg: string) => { if (!IS_PROD) console.info(msg); },
   };
   ```

2. Replace all `console.error` calls:
   ```typescript
   // Before:
   console.error("[Middleware] Lodge lookup failed:", error?.message);
   // After:
   import { logger } from "@/lib/logger";
   logger.error("[Middleware] Lodge lookup failed", error);
   ```

**Verification:**
```bash
NODE_ENV=production node -e "require('./src/lib/logger').logger.error('test', new Error('schema details'))"
# Output: "test Error" — not the raw message
```

---

### Solution 33: Add Content Security Policy Headers
**Problem:** No CSP; any XSS flaw is fully exploitable  
**File:** `next.config.js`

**Steps:**
1. Add CSP via Next.js headers config:
   ```typescript
   // next.config.js
   const CSP = [
     "default-src 'self'",
     "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com",
     "style-src 'self' 'unsafe-inline'",
     "img-src 'self' data: https:",
     "font-src 'self'",
     "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
     "frame-src https://js.stripe.com https://hooks.stripe.com",
     "object-src 'none'",
     "base-uri 'self'",
     "form-action 'self'",
   ].join("; ");

   module.exports = {
     async headers() {
       return [
         {
           source: "/:path*",
           headers: [
             { key: "Content-Security-Policy",        value: CSP },
             { key: "X-Frame-Options",                value: "SAMEORIGIN" },
             { key: "X-Content-Type-Options",          value: "nosniff" },
             { key: "Referrer-Policy",                 value: "strict-origin-when-cross-origin" },
             { key: "Permissions-Policy",              value: "camera=(), microphone=(), geolocation=()" },
             { key: "Strict-Transport-Security",       value: "max-age=63072000; includeSubDomains; preload" },
           ],
         },
       ];
     },
   };
   ```

**Verification:**
```bash
curl -I http://localhost:3000 | grep -i "content-security-policy"
# Should see CSP header
```

---

### Solution 34: Add X-Frame-Options and X-Content-Type-Options
Already covered inside Solution 33's headers block above — both headers are included in that single config change.

---

### Solution 35: Audit All dangerouslySetInnerHTML Usage
**Problem:** Risk of unescaped HTML rendering  
**Files:** All components

**Steps:**
1. Find all occurrences:
   ```bash
   grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"
   ```

2. For each occurrence, either:
   - Remove it and render as text: `<p>{content}</p>` instead of `<p dangerouslySetInnerHTML={{ __html: content }} />`
   - If HTML is required (e.g., rich text from a CMS), sanitise first:
     ```typescript
     import DOMPurify from "isomorphic-dompurify";
     <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
     ```

**Verification:**
```bash
grep -rn "dangerouslySetInnerHTML" src/
# Each remaining occurrence should use DOMPurify.sanitize()
```

---

## MEDIUM SEVERITY FIXES (Implement Within 1 Month)

### Solution 36: Strip Console.log from Production Build
**Problem:** `console.log` leaks data to browser DevTools  
**File:** `next.config.js`

**Steps:**
1. Enable the SWC `removeConsole` transform:
   ```typescript
   // next.config.js
   module.exports = {
     compiler: {
       removeConsole: process.env.NODE_ENV === "production"
         ? { exclude: ["error", "warn"] }
         : false,
     },
   };
   ```

2. Add ESLint rule to prevent new ones at development time:
   ```json
   // .eslintrc.json
   {
     "rules": {
       "no-console": ["warn", { "allow": ["error", "warn"] }]
     }
   }
   ```

**Verification:**
```bash
npm run build && grep -r "console\.log" .next/static/
# Expected: 0 matches
```

---

### Solution 37: Wire Errors to Structured Logger
**Problem:** Errors silently swallowed or logged without alerting  
**Files:** `src/middleware.ts`, all routes

Already addressed by Solution 32 (structured logger). Additionally add Sentry capture for unhandled errors — see Solution 83.

---

### Solution 38: Cap Retry Backoff in getTenantContext
**Problem:** Retry storm during Supabase outage exhausts server memory  
**File:** `src/lib/tenant.ts`

**Steps:**
1. Reduce retries and cap delay:
   ```typescript
   // src/lib/tenant.ts — replace retry loop
   const MAX_ATTEMPTS = 2;
   const BACKOFF_MS   = [150, 300]; // total max wait: 450ms

   let lastError: unknown;
   for (let i = 0; i < MAX_ATTEMPTS; i++) {
     try {
       const { data: profile } = await supabase.from("profiles").select("lodge_id").single();
       if (profile?.lodge_id) return profile.lodge_id;
     } catch (err) {
       lastError = err;
       if (i < MAX_ATTEMPTS - 1) await new Promise(r => setTimeout(r, BACKOFF_MS[i]));
     }
   }
   throw lastError ?? new Error("Failed to resolve tenant after retries");
   ```

**Verification:**
```bash
# Throttle Supabase API to 2000ms response
# getTenantContext should fail after ~500ms total, not 1750ms
```

---

### Solution 39: Add Circuit Breaker for Supabase Calls
**Problem:** Retry storm amplifies Supabase outage  
**File:** `src/lib/supabase/server.ts`

**Steps:**
1. Simple in-memory circuit breaker (sufficient for single-process Next.js):
   ```typescript
   // src/lib/circuit-breaker.ts
   let failures = 0;
   let openUntil = 0;
   const THRESHOLD = 5;
   const OPEN_MS   = 10_000; // 10 seconds

   export function circuitAllow(): boolean {
     if (Date.now() < openUntil) return false; // open
     return true;
   }

   export function circuitRecordFailure() {
     failures++;
     if (failures >= THRESHOLD) {
       openUntil = Date.now() + OPEN_MS;
       failures  = 0;
     }
   }

   export function circuitRecordSuccess() {
     failures = 0;
   }
   ```

2. Wrap calls in getTenantContext and middleware:
   ```typescript
   if (!circuitAllow()) throw new Error("Service temporarily unavailable (circuit open)");
   try {
     const result = await supabase.from("profiles").select("lodge_id").single();
     circuitRecordSuccess();
     return result;
   } catch (err) {
     circuitRecordFailure();
     throw err;
   }
   ```

**Verification:**
```bash
# Trigger 5 consecutive Supabase failures
# 6th request should fail immediately without hitting Supabase
```

---

### Solution 40: Wrap Reservation Creation in Atomic RPC
**Problem:** Multi-step reservation creation not transactional  
**File:** New migration + `src/app/reception/reservations/new/page.tsx`

**Steps:**
1. Create RPC:
   ```sql
   -- supabase/migrations/20260917000008_create_reservation_rpc.sql
   create or replace function public.create_reservation_atomic(
     p_lodge_id    uuid,
     p_name        text,
     p_mobile      text,
     p_email       text,
     p_room_id     uuid,
     p_check_in    date,
     p_check_out   date,
     p_rent        numeric,
     p_nights      integer
   )
   returns jsonb
   language plpgsql
   security definer
   as $$
   declare
     v_customer_id    uuid;
     v_reservation_id uuid;
     v_bill_id        uuid;
   begin
     -- 1. Upsert customer
     insert into public.customers(lodge_id, name, mobile, email)
     values (p_lodge_id, p_name, p_mobile, p_email)
     on conflict (lodge_id, mobile)
       do update set name = excluded.name, email = coalesce(excluded.email, customers.email)
     returning id into v_customer_id;

     -- 2. Insert reservation (exclusion constraint from Solution 19 guarantees no overlap)
     insert into public.reservations(lodge_id, customer_id, room_id, check_in, check_out, status)
     values (p_lodge_id, v_customer_id, p_room_id, p_check_in, p_check_out, 'confirmed')
     returning id into v_reservation_id;

     -- 3. Mark room reserved
     update public.rooms set status = 'reserved'
     where id = p_room_id and lodge_id = p_lodge_id;

     -- 4. Create bill
     insert into public.bills(lodge_id, reservation_id, net_amount, received, payment_status)
     values (p_lodge_id, v_reservation_id, p_rent * p_nights, 0, 'pending')
     returning id into v_bill_id;

     return jsonb_build_object(
       'customer_id',    v_customer_id,
       'reservation_id', v_reservation_id,
       'bill_id',        v_bill_id
     );
   end;
   $$;
   ```

2. Replace action body:
   ```typescript
   const { data, error } = await supabase.rpc("create_reservation_atomic", {
     p_lodge_id:  lodgeId,
     p_name:      sanitizeText(formData.get("name")),
     p_mobile:    normaliseMobile(formData.get("mobile") as string),
     p_email:     sanitizeText(formData.get("email")),
     p_room_id:   roomId,
     p_check_in:  checkIn,
     p_check_out: checkOut,
     p_rent:      rent,
     p_nights:    nights,
   });
   if (error) {
     if (error.code === "23P01") return { success: false, message: "Room already booked for those dates." };
     return { success: false, message: "Failed to create reservation." };
   }
   ```

**Verification:**
```bash
# Kill network mid-RPC (not possible; RPC is atomic server-side)
# Roll back by raising exception inside RPC — verify no partial rows
```

---

### Solution 41: Fix Timezone-Aware Date Filtering
**Problem:** `toLocaleDateString("en-CA")` uses server timezone, not lodge timezone  
**Files:** `src/app/reception/page.tsx`, all date-filtered queries

**Steps:**
1. Pass timezone as server environment variable:
   ```
   # .env.local
   LODGE_TIMEZONE=Asia/Kolkata
   ```

2. Use `date-fns-tz` for correct local date:
   ```bash
   npm install date-fns date-fns-tz
   ```

   ```typescript
   // src/lib/dates.ts
   import { toZonedTime, format } from "date-fns-tz";

   const TZ = process.env.LODGE_TIMEZONE ?? "Asia/Kolkata";

   export function todayInLodgeTz(): string {
     return format(toZonedTime(new Date(), TZ), "yyyy-MM-dd", { timeZone: TZ });
   }
   ```

3. Replace all `toLocaleDateString("en-CA")` calls:
   ```typescript
   // Before:
   const today = new Date().toLocaleDateString("en-CA");
   // After:
   import { todayInLodgeTz } from "@/lib/dates";
   const today = todayInLodgeTz();
   ```

**Verification:**
```bash
# Set TZ=UTC on server, LODGE_TIMEZONE=Asia/Kolkata
# At 23:00 UTC (= 04:30 IST next day), todayInLodgeTz() should return tomorrow's date
```

---

### Solution 42: Pre-Check Room Number Uniqueness Before Submit
**Problem:** User gets a database error after submit for duplicate room numbers  
**File:** `src/app/admin/rooms/new/page.tsx`

**Steps:**
1. Add debounced availability check on room_number input blur:
   ```tsx
   const [roomTaken, setRoomTaken] = useState(false);

   async function checkRoomNumber(value: string) {
     if (!value) return;
     const { data } = await supabase
       .from("rooms")
       .select("id")
       .eq("lodge_id", lodgeId)
       .eq("room_number", value)
       .maybeSingle();
     setRoomTaken(!!data);
   }

   // In JSX:
   <input
     name="room_number"
     onBlur={e => checkRoomNumber(e.target.value)}
   />
   {roomTaken && <p role="alert" className="text-red-600">Room number already exists.</p>}
   ```

**Verification:**
```bash
# Open room creation form, enter existing room number, tab out
# Error appears before submit
```

---

### Solution 43: Disable Submit Button During Pending Request
**Problem:** Double-click creates duplicate resources  
**Files:** All forms

**Steps:**
1. Add `isPending` state tied to form submission:
   ```tsx
   // Applies to createRoomAction, createReservationAction, etc.
   const [isPending, setIsPending] = useState(false);

   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (isPending) return;
     setIsPending(true);
     try {
       await formAction(new FormData(e.currentTarget as HTMLFormElement));
     } finally {
       setIsPending(false);
     }
   }

   // Button:
   <button type="submit" disabled={isPending} aria-busy={isPending}>
     {isPending ? "Creating..." : "Create Room"}
   </button>
   ```

   Alternatively, use React 19's `useFormStatus`:
   ```tsx
   import { useFormStatus } from "react-dom";
   function SubmitButton({ label }: { label: string }) {
     const { pending } = useFormStatus();
     return <button disabled={pending}>{pending ? "Saving…" : label}</button>;
   }
   ```

**Verification:**
```bash
# Click submit rapidly — only one request should be sent
```

---

### Solution 44: Add Alt Text to All Images
**Problem:** Screen readers get no description of images  
**Files:** All components with `<img>` or `<Image>`

**Steps:**
1. Find all images:
   ```bash
   grep -rn "<img\|<Image" src/ --include="*.tsx"
   ```

2. Add meaningful alt text — or `alt=""` for decorative images:
   ```tsx
   // Informational image
   <Image src="/logo.png" alt="LodgeOS logo" width={120} height={40} />

   // Decorative image (screen reader skips it)
   <Image src="/wave-divider.svg" alt="" width={800} height={20} aria-hidden="true" />
   ```

**Verification:**
```bash
# Run axe-core against each page
npx axe http://localhost:3000 --tags wcag2a
# No "image-alt" violations
```

---

### Solution 45: Replace Color-Only Status Badges with Icon+Label
**Problem:** Colorblind users can't distinguish status badges  
**Files:** Status badge components

**Steps:**
1. Add a text label and icon to every badge:
   ```tsx
   // src/components/shared/PayBadge.tsx
   const CONFIG = {
     paid:    { label: "Paid",    icon: "✓", bg: "bg-green-100", text: "text-green-800" },
     pending: { label: "Pending", icon: "⏳", bg: "bg-yellow-100", text: "text-yellow-800" },
     partial: { label: "Partial", icon: "½", bg: "bg-blue-100",   text: "text-blue-800" },
   } as const;

   export function PayBadge({ status }: { status: keyof typeof CONFIG }) {
     const { label, icon, bg, text } = CONFIG[status] ?? CONFIG.pending;
     return (
       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
         <span aria-hidden="true">{icon}</span>
         {label}
       </span>
     );
   }
   ```

**Verification:**
```bash
# View badges through a grayscale filter — each should still be distinguishable by label/icon alone
```

---

### Solution 46: Associate All Form Inputs with Explicit Labels
**Problem:** Placeholder-only inputs invisible to screen readers  
**Files:** All forms

**Steps:**
1. Replace placeholder-only patterns:
   ```tsx
   // Bad:
   <input type="text" placeholder="Customer Name" name="name" />

   // Good:
   <label htmlFor="customer-name">Customer Name</label>
   <input id="customer-name" type="text" name="name" placeholder="e.g. Rahul Sharma" />
   ```

2. Where visual label is undesired, use `aria-label`:
   ```tsx
   <input type="search" aria-label="Search reservations" placeholder="Search…" />
   ```

**Verification:**
```bash
npx axe http://localhost:3000/reception/reservations/new --tags wcag2a
# No "label" violations
```

---

### Solution 47: Handle Mobile Keyboard Layout-Shift
**Problem:** Keyboard covers bottom inputs on mobile  
**Files:** Mobile forms (CSS / viewport meta)

**Steps:**
1. Ensure viewport meta tag exists:
   ```tsx
   // src/app/layout.tsx
   export const metadata = {
     viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
   };
   ```

2. Scroll input into view on focus:
   ```tsx
   // Add to all bottom-of-page inputs
   <input
     onFocus={e => e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" })}
     ...
   />
   ```

3. Use `env(safe-area-inset-bottom)` for bottom-fixed buttons:
   ```css
   .bottom-bar { padding-bottom: env(safe-area-inset-bottom, 16px); }
   ```

**Verification:**
```bash
# Open new reservation form on iPhone Safari, focus last input
# Input should be visible above keyboard
```

---

### Solution 48: Increase Touch Target Sizes to 44×44px
**Problem:** Small buttons cause mis-taps on mobile  
**Files:** Button components, icon buttons

**Steps:**
1. Add minimum size utility:
   ```css
   /* globals.css */
   .touch-target {
     min-width:  44px;
     min-height: 44px;
     display:    inline-flex;
     align-items: center;
     justify-content: center;
   }
   ```

2. Apply to all clickable icons and small buttons:
   ```tsx
   <button className="touch-target" aria-label="Delete room">
     <TrashIcon className="w-5 h-5" />
   </button>
   ```

**Verification:**
```bash
npx axe http://localhost:3000 --tags wcag22
# No "target-size" violations
```

---

### Solution 49: Already covered in Solution 43 (disable button during submit).

---

### Solution 50: Announce Form Errors to Screen Readers
**Problem:** Validation errors visible but not announced  
**Files:** All forms

**Steps:**
1. Add `role="alert"` to error containers:
   ```tsx
   {error && (
     <p role="alert" aria-live="assertive" className="text-red-600 text-sm mt-1">
       {error}
     </p>
   )}
   ```

2. Link error to input via `aria-describedby`:
   ```tsx
   <input id="mobile" aria-describedby={mobileError ? "mobile-error" : undefined} ... />
   {mobileError && <p id="mobile-error" role="alert">{mobileError}</p>}
   ```

**Verification:**
```bash
# Use NVDA/VoiceOver, submit form with missing required field
# Screen reader should announce error message immediately
```

---

### Solution 51: Remove Hardcoded Port from Middleware
**Problem:** Localhost redirect hardcoded to port 3000  
**File:** `src/middleware.ts`

**Steps:**
1. Read port from environment or the request itself:
   ```typescript
   // src/middleware.ts — when constructing redirect URLs
   const host = request.headers.get("host") || "localhost:3000"; // preserves actual port
   const redirectUrl = `http://${subdomain}.${host}${pathname}`;
   ```

**Verification:**
```bash
npm run dev -- -p 3001
# Navigate to http://localhost:3001 — redirects should use port 3001
```

---

### Solution 52: Fix Night Count Calculation
**Problem:** Date arithmetic assumes midnight UTC, giving wrong night count  
**File:** `src/app/reception/reservations/new/page.tsx`

**Steps:**
1. Use date-only comparison (no time component):
   ```typescript
   // src/lib/dates.ts — add
   export function countNights(checkIn: string, checkOut: string): number {
     // Parse as calendar dates only (no time, no timezone)
     const [ciY, ciM, ciD] = checkIn.split("-").map(Number);
     const [coY, coM, coD] = checkOut.split("-").map(Number);
     const msPerDay = 86_400_000;
     const inMs  = Date.UTC(ciY, ciM - 1, ciD);
     const outMs = Date.UTC(coY, coM - 1, coD);
     return Math.round((outMs - inMs) / msPerDay);
   }
   ```

2. Replace inline calculation:
   ```typescript
   // Before:
   const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
   // After:
   import { countNights } from "@/lib/dates";
   const nights = countNights(checkIn, checkOut);
   ```

**Verification:**
```bash
node -e "const {countNights} = require('./src/lib/dates'); console.log(countNights('2026-01-15','2026-01-16'))"
# 1 — not 2 or 0
```

---

### Solution 53: Add Customer Cleanup on Failed Reservation
**Problem:** Orphaned customer record left when reservation fails mid-way  
**File:** Addressed completely by Solution 40 (atomic RPC) — the RPC rolls back the customer insert if any later step fails.

---

### Solution 54: Collapse Sidebar on Mobile
**Problem:** Fixed sidebar leaves no space for content on small screens  
**File:** Sidebar component

**Steps:**
1. Add mobile toggle:
   ```tsx
   // src/components/shared/Sidebar.tsx
   const [open, setOpen] = useState(false);

   return (
     <>
       {/* Hamburger — visible only on mobile */}
       <button
         className="md:hidden fixed top-4 left-4 z-50"
         aria-label="Open navigation"
         aria-expanded={open}
         onClick={() => setOpen(t => !t)}
       >
         ☰
       </button>

       {/* Overlay */}
       {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}

       {/* Sidebar */}
       <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl
         transform transition-transform md:translate-x-0
         ${open ? "translate-x-0" : "-translate-x-full"}`}>
         {/* nav items */}
       </nav>
     </>
   );
   ```

**Verification:**
```bash
# Resize browser to 375px — sidebar should be hidden, hamburger visible
# Click hamburger — sidebar slides in
```

---

### Solution 55: Add Skeleton Loading States
**Problem:** Blank screen while data loads makes page look broken  
**Files:** All page components

**Steps:**
1. Create a reusable skeleton:
   ```tsx
   // src/components/shared/Skeleton.tsx
   export function Skeleton({ className = "" }: { className?: string }) {
     return (
       <div
         className={`animate-pulse rounded bg-gray-200 ${className}`}
         aria-hidden="true"
       />
     );
   }
   ```

2. Use in pages while data loads:
   ```tsx
   // src/app/reception/page.tsx
   if (!rooms) {
     return (
       <div className="grid grid-cols-4 gap-4">
         {Array.from({ length: 8 }).map((_, i) => (
           <Skeleton key={i} className="h-24 w-full" />
         ))}
       </div>
     );
   }
   ```

**Verification:**
```bash
# Throttle network to Slow 3G, reload /reception
# Skeleton cards should appear instead of blank white
```

---

### Solution 56: Centralise Currency Config
**Problem:** `₹` hardcoded throughout the codebase  
**Files:** Multiple

**Steps:**
1. Create currency utility (see the full implementation in the earlier Solution 56 block from the original file — already written in full).

2. Add `currency` column to `lodges` table:
   ```sql
   alter table public.lodges add column if not exists currency text not null default 'INR'
     check (currency in ('INR','USD','EUR','GBP','AED','SGD'));
   ```

3. Pass `lodge.currency` to `formatCurrency()` wherever amounts are displayed.

**Verification:**
```bash
# Set lodge.currency = 'USD', reload billing page
# All amounts should display with $
```

---

### Solution 57: Store All Dates with Explicit Timezone
**Problem:** Date strings stored without timezone context  
**File:** All date insert/update operations

**Steps:**
1. Store lodges' IANA timezone:
   ```sql
   alter table public.lodges add column if not exists timezone text not null default 'Asia/Kolkata';
   ```

2. Store timestamps (paid_at, check_in, check_out) as `timestamptz` not `date`/`text`:
   ```sql
   -- Already timestamptz for payments.paid_at — ensure reservations.check_in/check_out
   -- are stored as date (correct for hotel use — a "day" not a moment)
   -- but interpreted in lodge timezone when presented
   ```

3. Use `todayInLodgeTz()` (Solution 41) for all "today's date" comparisons.

**Verification:**
```bash
# Lodge in UTC+5:30, server in UTC
# At 23:00 server time, dashboard should show IST date (next day)
```

---

### Solution 58: Add Database CHECK Constraint for room.status
**Problem:** Invalid status values can be inserted  
**File:** New migration

**Steps:**
```sql
-- supabase/migrations/20260917000009_room_status_constraint.sql
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('available','reserved','occupied','maintenance','cleaning'));
```

**Verification:**
```sql
insert into rooms(lodge_id, room_number, status) values ('xxx', '999', 'foobar');
-- ERROR: Check constraint violated
```

---

### Solution 59: Already addressed by Solution 30 (reservation status enum constraint).

---

### Solution 60: Add Migration Rollback Functions
**Problem:** No way to undo a failed migration  
**Files:** All migration files

**Steps:**
1. For every new migration, add a comment block with the rollback SQL:
   ```sql
   -- supabase/migrations/20260917000008_create_reservation_rpc.sql

   -- ROLLBACK:
   -- drop function if exists public.create_reservation_atomic(uuid,text,text,text,uuid,date,date,numeric,integer);

   create or replace function public.create_reservation_atomic(...) ...
   ```

2. For destructive migrations (drop column, drop table), always create the inverse first and test it:
   ```bash
   # Template for new migrations:
   # 1. Write rollback SQL in comments at top
   # 2. Test rollback in dev before merging
   # 3. Apply forward migration to staging, verify
   # 4. Apply to production
   ```

**Verification:**
```bash
# Apply migration, run rollback SQL, verify DB state matches pre-migration state
```

---

### Solution 61: Add NOT NULL Constraint to customers.name
**Problem:** NULL name breaks UI components  
**File:** New migration

**Steps:**
```sql
-- supabase/migrations/20260917000010_customers_name_not_null.sql

-- Fix existing NULLs first
update public.customers set name = 'Unknown Guest' where name is null;

-- Then enforce
alter table public.customers alter column name set not null;
alter table public.customers alter column name set default 'Unknown Guest';
```

**Verification:**
```sql
insert into customers(lodge_id, mobile) values ('xxx', '9999999999');
-- ERROR: null value in column "name" violates not-null constraint
```

---

### Solution 62: Add Unique Constraint on customers.email per Lodge
**Problem:** Duplicate customer emails within same lodge  
**File:** New migration

**Steps:**
```sql
-- supabase/migrations/20260917000011_customers_email_unique.sql

-- Only unique where email is not null
create unique index if not exists idx_customers_email_unique
  on public.customers(lodge_id, email)
  where email is not null;
```

**Verification:**
```sql
-- Try inserting two customers with same email in same lodge
-- Expected: unique violation on second insert
```

---

### Solution 63: Add Payment History Audit Table
**Problem:** Generated `balance` column recalculates without history  
**File:** New migration

**Steps:**
1. Create audit table:
   ```sql
   -- supabase/migrations/20260917000012_payment_history.sql
   create table if not exists public.payment_history (
     id          uuid primary key default gen_random_uuid(),
     bill_id     uuid not null references public.bills(id) on delete cascade,
     lodge_id    uuid not null references public.lodges(id) on delete cascade,
     amount      numeric not null,
     action      text not null check (action in ('payment','refund','adjustment')),
     balance_after numeric not null,
     created_at  timestamptz not null default now(),
     created_by  uuid references auth.users(id)
   );

   alter table public.payment_history enable row level security;

   create policy "payment_history_select" on public.payment_history
     for select using (lodge_id = public.get_auth_lodge_id());
   ```

2. Insert a history row in the `create_reservation_atomic` RPC and in the webhook processor whenever a payment is recorded or refunded.

**Verification:**
```bash
# Create reservation, make partial payment, make refund
# payment_history should show 3 rows with correct balance_after each time
```

---

### Solution 64: Require Email Verification Before Dashboard Access
**Problem:** Users get immediate access without verifying email  
**File:** `src/app/actions/auth.ts`, `src/middleware.ts`

**Steps:**
1. Remove `email_confirm: true` bypass and let Supabase send verification email:
   ```typescript
   // src/app/actions/auth.ts — change admin createUser call
   await adminSupabase.auth.admin.createUser({
     email,
     password,
     // email_confirm: true  ← REMOVE THIS LINE
     user_metadata: { full_name: ownerName },
   });
   ```

2. In middleware, check `email_confirmed_at`:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (user && !user.email_confirmed_at) {
     return NextResponse.redirect(new URL("/auth/verify-email", request.url));
   }
   ```

3. Create `/auth/verify-email` page explaining the user must check their email.

**Verification:**
```bash
# Register, attempt to access /reception
# Should redirect to /auth/verify-email
# After clicking email link, /reception accessible
```

---

### Solution 65 & 66: Account Lockout via Supabase Settings
**Problem:** No lockout after repeated failed logins  
**File:** Supabase Dashboard (no code change)

**Steps:**
1. In Supabase Dashboard → Authentication → Rate Limits:
   - Set "Max sign-in attempts before lockout" = 5
   - Set "Lockout duration" = 15 minutes

2. This is enforced server-side by Supabase auth — no code required.

**Verification:**
```bash
# Attempt 6 wrong logins for same email
# 6th attempt: Supabase returns "too many requests" error
```

---

## LOW SEVERITY FIXES (Nice-to-Have — 3 Months)

### Solution 67: Add README.md
**Problem:** No setup documentation  
**File:** `README.md` (project root)

**Steps:**
```markdown
# LodgeOS — Hotel Management System

Built with Next.js 15, React 19, and Supabase.

## Quick Start

\`\`\`bash
git clone <repo>
cd bs
cp .env.example .env.local   # fill in your Supabase credentials
npm install
npx supabase db push         # apply migrations
npm run dev
\`\`\`

## Local subdomain testing

Add to `C:\Windows\System32\drivers\etc\hosts`:
\`\`\`
127.0.0.1 testlodge.localhost
\`\`\`

Then open: http://testlodge.localhost:3000

## Environment Variables

See `.env.example` for required variables.  
Never commit `.env.local` — it is git-ignored.

## Deployment

1. Push env vars to Vercel project settings
2. Run `vercel deploy`
3. Configure wildcard domain `*.yourdomain.com` in Vercel domains
```

---

### Solution 68: Add CHANGELOG.md
**File:** `CHANGELOG.md`

```markdown
# Changelog

## [Unreleased]
### Security
- Add webhook signature verification (Solution 2)
- Add rate limiting on auth endpoints (Solution 3)
- Remove service role key from version control (Solution 1)

## [0.1.0-beta] — 2026-09-16
### Added
- Initial beta release
- Multi-tenant lodge management
- Room, reservation, billing, RBAC modules
- Stripe and Razorpay gateway integration
```

---

### Solution 69: Delete Commented-Out Code
**Problem:** Dead code clutters files  
**Steps:**
```bash
# Find blocks of commented code (3+ consecutive comment lines)
grep -rn "^\s*//" src/ --include="*.ts" --include="*.tsx" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20
# Review each file and delete dead comment blocks
# Git tracks history — no need to keep commented code
```

---

### Solution 70: Act on TODO Comments or Delete Them
**Steps:**
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"
# For each: either create a GitHub issue and delete the comment, or fix it now
```

---

### Solution 71: Establish Consistent Naming Convention
**File:** `CONTRIBUTING.md` (new)

```markdown
## Naming Conventions

- **Database columns:** snake_case (`lodge_id`, `check_in`)
- **TypeScript types/interfaces:** PascalCase (`ReservationStatus`)
- **TypeScript props/variables:** camelCase (`lodgeId`, `checkIn`)
- **Files:** kebab-case (`payments-gateway.ts`)
- **React components:** PascalCase (`ReceptionPage.tsx`)
- **Server actions:** camelCase ending in `Action` (`createReservationAction`)
```

---

### Solution 72: Replace Magic Numbers with Named Constants
**Steps:**
```typescript
// src/lib/constants.ts
export const RETRY_ATTEMPTS    = 2;
export const RETRY_BASE_MS     = 150;
export const PAGE_SIZE         = 50;
export const SESSION_REFRESH_THRESHOLD_SEC = 60;
export const CIRCUIT_BREAKER_THRESHOLD     = 5;
export const CIRCUIT_BREAKER_OPEN_MS       = 10_000;
export const AUDIT_LOG_RETENTION_DAYS      = 90;
```

Replace every magic number occurrence with the named constant.

---

### Solution 73: Add Zod Validation for Server Action Inputs
**Steps:**
```tsx
// npm install zod
import { z } from "zod";

const ReservationSchema = z.object({
  name:          z.string().min(1).max(100),
  mobile:        z.string().regex(/^\d{10}$/),
  email:         z.string().email().optional().or(z.literal("")),
  room_id:       z.string().uuid(),
  check_in:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rent:          z.coerce.number().positive(),
});

// In action:
const parsed = ReservationSchema.safeParse(Object.fromEntries(formData));
if (!parsed.success) {
  return { success: false, message: parsed.error.errors[0].message };
}
const { name, mobile, email, room_id, check_in, check_out, rent } = parsed.data;
```

---

### Solution 74: Add displayName to Arrow Function Components
**Steps:**
```typescript
// For every exported arrow function component:
const RoomCard = ({ room }: { room: Room }) => { /* ... */ };
RoomCard.displayName = "RoomCard"; // Add this

// Or just use function declarations:
export function RoomCard({ room }: { room: Room }) { /* ... */ }
// displayName is automatic for named functions
```

---

### Solution 75: Add Unit Tests with Vitest
**Steps:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Priority test targets (highest ROI):
- `src/lib/dates.ts` — `countNights`, `todayInLodgeTz`
- `src/lib/sanitize.ts` — `sanitizeText`, `normaliseMobile`
- `src/lib/currency.ts` — `formatCurrency`
- `src/lib/rate-limit.ts` — limiter logic

---

### Solution 76: Add E2E Tests with Playwright
**Steps:**
```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// tests/e2e/reservation.spec.ts
import { test, expect } from "@playwright/test";

test("create reservation happy path", async ({ page }) => {
  await page.goto("http://testlodge.localhost:3000/auth/login");
  await page.fill("#email", "admin@testlodge.com");
  await page.fill("#password", "TestPass123");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/reception/);

  await page.goto("http://testlodge.localhost:3000/reception/reservations/new");
  await page.fill("#name", "Test Guest");
  await page.fill("#mobile", "9876543210");
  // ... complete form
  await page.click("button[type=submit]");
  await expect(page.locator(".success-message")).toBeVisible();
});
```

Cover at minimum: login, create reservation, checkout, create room.

---

### Solution 77: Set Up CI/CD Pipeline
**File:** `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --run
      - run: npm run build
```

Add `"type-check": "tsc --noEmit"` to `package.json` scripts.

---

### Solution 78: Add ESLint and Prettier
**Steps:**
```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier
```

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

```json
// .prettierrc
{ "semi": true, "singleQuote": false, "tabWidth": 2, "trailingComma": "es5" }
```

```bash
# Add pre-commit hook
npm install -D lint-staged husky
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

---

### Solution 79: Remove Unused Dependencies
**Steps:**
```bash
npm install -D knip
npx knip --dependencies  # lists unused deps
```

Review output and remove confirmed unused packages:
```bash
npm uninstall <unused-package>
```

---

### Solution 80: Lazy Load Heavy Components
**Steps:**
```typescript
// Replace static imports of heavy/rarely-used components
import dynamic from "next/dynamic";

const PaymentGatewaySettings = dynamic(
  () => import("@/components/admin/PaymentGatewaySettings"),
  { loading: () => <Skeleton className="h-64 w-full" /> }
);

const RBACManager = dynamic(
  () => import("@/components/admin/RBACManager"),
  { ssr: false }
);
```

**Verification:**
```bash
npm run build
# Check `.next/static/chunks/` — no single chunk > 200kB uncompressed
```

---

### Solution 81: Use next/image for All Images
**Steps:**
```bash
grep -rn "<img " src/ --include="*.tsx"
# Replace each with Next.js Image
```

```tsx
import Image from "next/image";

// Before:
<img src="/logo.png" />

// After:
<Image src="/logo.png" alt="LodgeOS" width={120} height={40} priority />
```

---

### Solution 82: Add Favicon and PWA Manifest
**File:** `public/manifest.json`, `src/app/layout.tsx`

```json
// public/manifest.json
{
  "name": "LodgeOS",
  "short_name": "LodgeOS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```tsx
// src/app/layout.tsx
export const metadata = {
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};
```

---

### Solution 83: Add Sentry Error Monitoring
**Steps:**
```bash
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.example`.

**Verification:**
```bash
# Trigger a deliberate error, check Sentry dashboard within 30 seconds
```

---

### Solution 84: Add Feature Flags
**Steps:**
1. Use a simple env-var based approach (no new dependency):
   ```typescript
   // src/lib/flags.ts
   export const FLAGS = {
     PAYMENT_GATEWAY_ENABLED: process.env.NEXT_PUBLIC_FLAG_PAYMENT_GATEWAY === "true",
     NEW_RESERVATION_FLOW:    process.env.NEXT_PUBLIC_FLAG_NEW_RESERVATION  === "true",
   } as const;
   ```

2. Gate features:
   ```tsx
   {FLAGS.PAYMENT_GATEWAY_ENABLED && <PaymentGatewaySettings />}
   ```

3. Set flags per environment in Vercel env vars.

---

### Solution 85: Enable Supabase Point-in-Time Recovery
**Steps:**
1. Supabase Dashboard → Settings → Backups
2. Enable "Point in Time Recovery" (requires Pro plan)
3. Set retention to at least 7 days
4. Test a restore annually

---

### Solution 86: Create a Staging Environment
**Steps:**
1. Create a second Supabase project (free tier) for staging
2. Add a second Vercel environment: `staging` branch → staging env vars → staging Supabase URL
3. Apply all migrations to staging before production with each deployment

---

### Solution 87: Fix Hardcoded Tauri Release URL
**Problem:** Old version URL baked in  
**File:** `.env.local`

**Steps:**
1. Use Tauri's built-in updater with a dynamic endpoint:
   ```
   # .env.example (replace static URL)
   TAURI_UPDATER_ENDPOINT=https://yourdomain.com/api/updates/latest
   ```

2. Create the updater endpoint:
   ```typescript
   // src/app/api/updates/latest/route.ts
   export async function GET() {
     // Read latest version from GitHub Releases API
     const response = await fetch(
       "https://api.github.com/repos/yourorg/lodgeos/releases/latest",
       { headers: { Accept: "application/vnd.github+json" } }
     );
     const release = await response.json();
     return NextResponse.json({
       version: release.tag_name,
       notes: release.body,
       pub_date: release.published_at,
       platforms: {
         "windows-x86_64": { url: release.assets.find((a: any) => a.name.endsWith(".msi"))?.browser_download_url },
         "darwin-aarch64": { url: release.assets.find((a: any) => a.name.includes("aarch64.dmg"))?.browser_download_url },
       },
     });
   }
   ```

**Verification:**
```bash
curl http://localhost:3000/api/updates/latest | jq .version
# Should return the current latest GitHub release tag
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1 — Critical Security (Week 1)
- [ ] #1  Remove service role key from git + rotate key
- [ ] #2  Add webhook signature verification (Stripe + Razorpay)
- [ ] #3  Add rate limiting on login (Upstash Redis)
- [ ] #4  Add rate limiting on registration
- [ ] #5  Enforce HTTPS + HSTS in production
- [ ] #6  Fix `get_auth_lodge_id()` to throw on NULL
- [ ] #7  Sanitize all user input (DOMPurify)
- [ ] #8  Add CORS origin validation to webhook endpoint
- [ ] #9  Set httpOnly + secure + sameSite cookie flags
- [ ] #10 Remove hardcoded API keys from payments-gateway.ts
- [ ] #11 Remove `?subdomain=` override from all environments
- [ ] #12 Configure Supabase connection pooler

### Phase 2 — High Severity (Week 2–3)
- [ ] #13 Middleware fail-closed on DB error
- [ ] #14 Enforce password >= 8 chars + uppercase + number
- [ ] #15 CSRF protection via allowedOrigins
- [ ] #16 Replace email regex with validator library
- [ ] #17 Add password reset flow
- [ ] #18 Handle JWT expiration with auto-refresh
- [ ] #19 Add exclusion constraint for overlapping reservations
- [ ] #20 Unique subdomain constraint + pre-check
- [ ] #21 Cap middleware retries to 1 with jitter
- [ ] #22 Soft-delete lodges instead of cascade
- [ ] #23 Remove standalone room status update (use RPC)
- [ ] #24 Move bill arithmetic to PostgreSQL numeric
- [ ] #25 Paginate all list queries (PAGE_SIZE = 50)
- [ ] #26 Add performance indexes on all filtered columns
- [ ] #27 Add idempotency key check on webhook ingestion
- [ ] #28 Add refunded_at column + status constraint
- [ ] #29 Add audit log retention + pg_cron purge
- [ ] #30 Normalise reservation status enum (DB + TS)
- [ ] #31 Normalise mobile numbers before write
- [ ] #32 Replace console.error with structured logger
- [ ] #33 Add CSP + security headers in next.config.js
- [ ] #34 (Covered by #33)
- [ ] #35 Audit dangerouslySetInnerHTML usage

### Phase 3 — Medium Severity (Week 4–6)
- [ ] #36 Strip console.log from production build
- [ ] #37 (Covered by #32)
- [ ] #38 Cap retry backoff in getTenantContext
- [ ] #39 Add circuit breaker around Supabase calls
- [ ] #40 Atomic reservation RPC (create_reservation_atomic)
- [ ] #41 Fix timezone-aware date filtering
- [ ] #42 Pre-check room number uniqueness on blur
- [ ] #43 Disable submit button during pending request
- [ ] #44 Add alt text to all images
- [ ] #45 Replace color-only badges with icon+label
- [ ] #46 Associate inputs with explicit `<label>` elements
- [ ] #47 Handle mobile keyboard viewport shift
- [ ] #48 Enforce 44×44px minimum touch targets
- [ ] #49 (Covered by #43)
- [ ] #50 Add `role="alert"` to form error messages
- [ ] #51 Remove hardcoded port from middleware redirects
- [ ] #52 Fix night count arithmetic with UTC date parsing
- [ ] #53 (Covered by #40)
- [ ] #54 Collapse sidebar on mobile with hamburger toggle
- [ ] #55 Add skeleton loading states
- [ ] #56 Centralise currency configuration
- [ ] #57 Store lodge timezone, use it for date display
- [ ] #58 Add CHECK constraint on rooms.status
- [ ] #59 (Covered by #30)
- [ ] #60 Add rollback SQL to all new migrations
- [ ] #61 Make customers.name NOT NULL
- [ ] #62 Unique index on customers.email per lodge
- [ ] #63 Add payment_history audit table
- [ ] #64 Require email verification before dashboard access
- [ ] #65/#66 Enable Supabase auth lockout policy

### Phase 4 — Low Severity (Month 2–3)
- [ ] #67 Write README.md
- [ ] #68 Write CHANGELOG.md
- [ ] #69 Delete commented-out code
- [ ] #70 Resolve or delete TODO comments
- [ ] #71 Document naming conventions in CONTRIBUTING.md
- [ ] #72 Replace magic numbers with named constants
- [ ] #73 Add Zod schema validation to all server actions
- [ ] #74 Add displayName to arrow function components
- [ ] #75 Set up Vitest unit tests
- [ ] #76 Set up Playwright E2E tests
- [ ] #77 Set up GitHub Actions CI pipeline
- [ ] #78 Add ESLint + Prettier + pre-commit hooks
- [ ] #79 Audit and remove unused dependencies
- [ ] #80 Lazy-load heavy admin components
- [ ] #81 Replace `<img>` with `next/image`
- [ ] #82 Add favicon + PWA manifest
- [ ] #83 Add Sentry error monitoring
- [ ] #84 Add env-var feature flags
- [ ] #85 Enable Supabase Point-in-Time Recovery
- [ ] #86 Create staging environment
- [ ] #87 Fix Tauri updater to use dynamic endpoint

---

**End of Solutions Guide — 87 solutions across 4 implementation phases**