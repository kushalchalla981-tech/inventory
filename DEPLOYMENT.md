# Vercel Deployment Guide

This document outlines the steps to successfully deploy the Inventory Application to Vercel.

## 1. Prerequisites

Before deploying to Vercel, ensure you have the following:
- A GitHub, GitLab, or Bitbucket account with this repository pushed.
- A Vercel account (free tier is sufficient).
- A Supabase project with the database and authentication already configured.

## 2. Deploying to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click the **"Add New"** button and select **"Project"**.
3. Import the Git repository containing this project.
4. Configure the project:
   - **Framework Preset:** Vercel should automatically detect **Next.js**. If not, select it.
   - **Root Directory:** If your code is in the root, leave it as `./`. If it is inside a folder (like `inventory-app`), select that directory.
   - **Build Command:** `npm run build` (Default)
   - **Output Directory:** `.next` (Default)
   - **Install Command:** `npm install` (Default)

## 3. Environment Variables

You must configure the following Environment Variables in Vercel before the initial build or the build will fail.

In the "Environment Variables" section of the Vercel deployment screen, add the following keys and values:

| Key | Value (Where to find it) |
|-----|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (Supabase -> Settings -> API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key (Supabase -> Settings -> API) |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`| (Optional) Firebase VAPID Key if you are using push notifications. |

> **Note:** Do NOT include any secret keys (like `service_role` keys) with the `NEXT_PUBLIC_` prefix, as they will be exposed to the browser.

## 4. Google OAuth Configuration (Crucial for Vercel)

Since authentication is handled via Google OAuth through Supabase, you must update your Google Cloud Console to allow redirects from your new Vercel domain.

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Find your OAuth 2.0 Client ID for this project.
3. Under **Authorized redirect URIs**, add your Supabase redirect URI (e.g., `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`).
4. In your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
   - Set the **Site URL** to your new Vercel domain (e.g., `https://your-app-name.vercel.app`).
   - Add the Vercel domain to the **Redirect URLs** list.

## 5. Finalizing Deployment

1. Click the **"Deploy"** button in Vercel.
2. Wait for the build process to finish. If the build fails, check the Vercel logs to ensure all environment variables are correctly set.
3. Once successful, Vercel will provide you with a live URL (e.g., `https://your-app-name.vercel.app`).

## 6. Post-Deployment Checklist

- [ ] Visit the Vercel URL.
- [ ] Attempt to log in with the Owner account (`kushalchalla981@gmail.com`) to verify OAuth works.
- [ ] Test adding an Allowed User from the Owner Dashboard.
- [ ] Log out and log in with the newly added Allowed User's Google account to ensure Role redirection works properly.
