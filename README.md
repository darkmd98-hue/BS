# LodgeOS — Multi-Tenant Property Management System

LodgeOS is a multi-tenant SaaS property management system engineered for lodges, boutique hotels, and multi-property hospitality operators.

## Architecture

- **Framework**: Next.js (App Router, Server Actions, Server Components)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Subdomain Multi-Tenancy
- **Styling**: Tailwind CSS
- **Integrations**: Stripe, Razorpay, Twilio (SMS/WhatsApp), SendGrid (Email)

## Quick Start

### 1. Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase Project or local CLI

### 2. Environment Variables
Copy `.env.example` to `.env.local` and configure:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_WEBHOOK_SECRET=whsec_...
RAZORPAY_WEBHOOK_SECRET=...
```

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```

## Security & Architecture Highlights
- Multi-tenant isolation at middleware and database RLS levels.
- Exclusion constraints on date ranges preventing double-booking race conditions.
- Cryptographically verified webhooks (HMAC-SHA256 / Stripe signatures).
- Slide-window rate limiting on sensitive authentication routes.
- Sanitized user inputs via DOMPurify.
