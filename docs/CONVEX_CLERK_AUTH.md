# Convex + Clerk auth setup

This project uses Clerk for authentication and Convex for the backend. Convex validates Clerk JWTs using an **issuer domain** that must match exactly.

## Error: "No auth provider found matching the given token"

This means the JWT your app sends has an **issuer** (or audience) that doesn’t match what’s configured in Convex.

### Fix (check in this order)

1. **Clerk JWT template**
   - In [Clerk Dashboard](https://dashboard.clerk.com) go to **JWT templates**.
   - Create a template if needed: **New template** → choose **Convex**.
   - **Do not rename it** – the template name must be **`convex`** (lowercase).
   - Open the template and copy the **Issuer** URL (e.g. `https://vital-mustang-88.clerk.accounts.dev`).
   - Use **no trailing slash** in the URL.

2. **Convex environment variable**
   - In [Convex Dashboard](https://dashboard.convex.dev) open your project.
   - Go to **Settings** → **Environment Variables**.
   - Select the deployment you use (e.g. **Development**).
   - Add or update:
     - **Name:** `CLERK_JWT_ISSUER_DOMAIN`
     - **Value:** the exact Issuer URL from step 1 (e.g. `https://vital-mustang-88.clerk.accounts.dev`).
   - Save.

3. **Sync Convex**
   - From the project root run:
     ```bash
     npx convex dev
     ```
   - So the new env var and auth config are applied.

4. **Match issuer format**
   - Convex compares the token’s `iss` claim to `CLERK_JWT_ISSUER_DOMAIN` (often with a trailing slash normalized).
   - If it still fails, try setting `CLERK_JWT_ISSUER_DOMAIN` **with** a trailing slash: `https://your-app.clerk.accounts.dev/`.
   - Or try **without** a trailing slash. One of the two will match what Clerk puts in the JWT.

### Summary

| Where              | What to set |
|--------------------|------------|
| Clerk Dashboard    | JWT template named **convex**, copy its **Issuer** URL |
| Convex Dashboard   | Env var **CLERK_JWT_ISSUER_DOMAIN** = that Issuer URL (try with and without trailing slash if needed) |
| Local / Vercel     | `CLERK_JWT_ISSUER_DOMAIN` is **not** used by the Next.js app; Convex reads it from its own dashboard only |

After changing the Convex env var, always run `npx convex dev` (or `npx convex deploy` for production).
