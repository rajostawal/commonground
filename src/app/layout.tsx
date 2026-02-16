import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "CommonGround",
  description: "Household coordination for roommates and co-living groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          signInFallbackRedirectUrl="/bulletin-board"
          signUpFallbackRedirectUrl="/bulletin-board"
          appearance={{
            variables: {
              colorBackground: "#0a0a0a",
              colorInputBackground: "#111111",
              colorInputText: "#f2f2f2",
              colorText: "#f2f2f2",
              colorTextSecondary: "#a0a0a0",
              colorPrimary: "#5b7fa6",
              colorDanger: "#c0392b",
              borderRadius: "0.5rem",
              fontFamily: "Inter, system-ui, sans-serif",
            },
            elements: {
              card: "bg-[#111111] border border-white/10",
              formButtonPrimary: "bg-[#5b7fa6] hover:bg-[#6b8fb6]",
            },
          }}
        >
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
