import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">CommonGround</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Sign in to your household</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
