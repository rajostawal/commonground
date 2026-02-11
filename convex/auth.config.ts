import type { AuthConfig } from "convex/server";

/**
 * Convex auth configuration for validating Clerk JWTs.
 *
 * Required: Set CLERK_JWT_ISSUER_DOMAIN in the Convex Dashboard (Settings → Environment Variables).
 * - Get the value from Clerk Dashboard → JWT templates → create/use "Convex" template → copy the Issuer URL.
 * - Use the exact Issuer URL (e.g. https://your-app.clerk.accounts.dev with NO trailing slash).
 * - This value is read by Convex's servers only; .env.local is for Next.js and is not used here.
 *
 * If you see "No auth provider found matching the given token", the JWT issuer from Clerk
 * does not match CLERK_JWT_ISSUER_DOMAIN. Fix: set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard
 * to the Issuer URL from your Clerk "convex" JWT template, then run `npx convex dev`.
 *
 * See https://docs.convex.dev/auth/clerk
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
