# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Material Transport & Inventory Coordination System** - A full-stack web application for managing inventory, request workflows, and delivery execution across multiple shop locations. Built with Next.js 16, Supabase, Firebase Cloud Messaging, and Twilio.

**Tech Stack**: Next.js 16.2 | React 19 | TypeScript 5 | Tailwind CSS 4 | Supabase (PostgreSQL) | Firebase FCM | Google OAuth

**Architecture**: Next.js App Router with Server Components, Client Components for interactivity, and Supabase for backend services (database, auth, edge functions). Row Level Security (RLS) enforces role-based access control directly in the database.

## Common Development Tasks

### Setup & Installation

```bash
cd inventory-app
npm install
```

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key for push notifications
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID

Important: `.env.local` is gitignored. Never commit secrets.

### Development Server

```bash
npm run dev
# Opens at http://localhost:3000
```

Next.js hot reloads automatically on file changes.

### Building & Production

```bash
npm run build     # Creates optimized production build in .next/
npm start         # Starts production server (after build)
```

### Linting

```bash
npm run lint      # Runs ESLint with Next.js config
```

**Note**: No test runner is configured yet. The default `test` script is a placeholder.

## Database Setup (Supabase)

1. Create a new Supabase project
2. Execute SQL from `supabase-setup.sql` in the Supabase SQL editor
3. Create a storage bucket named `delivery-proofs` for delivery photos
4. Deploy Supabase Edge Functions (see below)

## Supabase Edge Functions

Located in `supabase/functions/`:
- `verify-otp` - OTP verification via Twilio
- `send-sms` - SMS notifications
- `send-push` - Firebase push notifications

Deploy with:
```bash
cd supabase/functions/verify-otp
npx supabase functions deploy verify-otp
# Repeat for send-sms, send-push
```

After deployment, set secrets via Supabase dashboard:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

## High-Level Architecture

### Authentication Flow
- Users sign in via Google OAuth through Supabase Auth
- Upon signup, a `profiles` record is auto-created with default role 'shopkeeper'
- `AuthContext` provides user session and profile data throughout the app
- FCM token is requested and stored in profile for push notifications

### Role-Based Access Control (RBAC)
Three roles with different permissions enforced via RLS policies:

| Role | Permissions |
|------|-------------|
| Owner | View all data, manage user roles, full read access |
| Transporter | Update inventory, manage request statuses, verify deliveries |
| Shopkeeper | Create requests, upload delivery proofs, view own requests |

### Request Workflow
8 status stages (enforced by database constraints):
1. Placed → 2. Received → 3. Reviewed → 4. Scheduled → 5. Delivered → 6. Photo Uploaded → 7. Verified → 8. Completed

Transporter moves requests through stages. Shopkeeper uploads delivery proof photo. Transporter verifies and completes.

### Data Models
- `profiles` - User profiles with role and location
- `inventory_items` - Catalog of materials with costs
- `requests` - Material request orders with status
- `request_items` - Line items for each request
- `delivery_proofs` - Delivery photo URLs
- `notifications` - In-app notification queue

### Frontend Structure
```
src/
├── app/
│   ├── layout.tsx          # Root layout with Geist fonts, AuthProvider
│   ├── page.tsx            # Home page (not used, redirects to login)
│   ├── login/page.tsx     # Google OAuth login
│   └── dashboard/
│       ├── page.tsx       # Router to role-specific dashboards
│       ├── owner/page.tsx      # Full overview + user management
│       ├── transporter/page.tsx # Request management
│       └── shopkeeper/page.tsx # Create requests, track status
├── context/
│   └── AuthContext.tsx    # Client-side auth state management
└── lib/
    ├── supabase.ts        # Supabase client singleton
    └── firebase.ts        # Firebase FCM initialization
```

### Styling
- Tailwind CSS 4 with `@tailwindcss/postcss`
- Heroicons (outline) for UI icons
- Custom CSS in `app/globals.css`
- Responsive design (mobile-first breakpoints)
- Design: Blue/purple gradients, rounded corners (2xl), white cards on gray background

## Key Implementation Patterns

### Server vs Client Components
- Pages marked `'use client'` when interactivity needed (LoginPage, dashboard pages)
- Layouts and metadata export are server components by default
- All data fetching uses client-side Supabase calls (no server-side fetch yet)

### TypeScript Interfaces
Database record types defined inline in components. Consider extracting to `src/types/` if reused.

### Error Handling
- Simple `try/catch` with `alert()` for user feedback
- No centralized error boundary or toast notifications yet

### State Management
- `useState` for local component state
- `AuthContext` for global auth state
- No additional state libraries (Zustand, Redux, etc.)

## Deployment

This app is configured for Vercel deployment:
- Next.js 16 optimized for Vercel platform
- Set environment variables in Vercel dashboard (same as `.env.local`)
- Edge Functions are Supabase-specific, not Vercel Functions
- Custom domain: `inventory-taupe-zeta.vercel.app`

## Known Issues & Future Improvements

- No unit/integration tests configured
- Error handling could use toast notifications instead of alerts
- Components have some duplication (dashboard pages could share layout)
- Consider adding loading skeletons for better UX
- SQL injection safe (parameterized queries) but no input validation on frontend
- FCM token handling could be more robust (handle permission denied)
- No offline support or request caching

## Security Notes

- RLS is enabled on all tables - never bypass in queries
- Only expose Supabase anon key (has limited permissions via RLS)
- Service role key should only be used in Edge Functions, never client-side
- FCM API key is not sensitive (public key for web push)
- OAuth redirect URIs must be configured in Supabase Auth settings

## Dependencies to Know

- `@supabase/supabase-js` - Supabase client library
- `firebase` - Firebase Cloud Messaging
- `@heroicons/react` - Icon set
- `next` 16.2.1 - Framework with App Router
- `react` 19.2.4 - UI library
- `typescript` 5 - Type checking
- `tailwindcss` 4 - Utility-first CSS
- `eslint-config-next` - ESLint rules for Next.js

## Git Workflow

No strict branching model enforced yet. Feature branches and PRs welcome.

---

Built with Next.js, Supabase, and Firebase. See README.md for more details.
