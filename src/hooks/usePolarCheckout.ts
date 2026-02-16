"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/hooks/useToast";

const checkoutUrl = process.env.NEXT_PUBLIC_POLAR_CHECKOUT_LINK;

export function usePolarCheckout() {
  const { user } = useUser();

  const openCheckout = useCallback(async () => {
    if (!checkoutUrl) {
      console.error("NEXT_PUBLIC_POLAR_CHECKOUT_LINK is not configured");
      toast({ title: "Checkout unavailable", description: "Payment is not configured. Please try again later.", variant: "error" });
      return;
    }

    // Build URL with customer email so the webhook can match the subscription to this user
    const url = new URL(checkoutUrl);
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
      url.searchParams.set("customer_email", email);
    }

    try {
      const { PolarEmbedCheckout } = await import("@polar-sh/checkout/embed");
      const checkout = await PolarEmbedCheckout.create(url.toString(), { theme: "dark" });

      checkout.addEventListener("success", (event) => {
        // Prevent default redirect — we handle it ourselves
        event.preventDefault();
        toast({
          title: "Payment successful!",
          description: "Welcome to Pro. Your features are being activated.",
          variant: "success",
          duration: 6000,
        });
        // Close the embed after a short delay so user sees the success state
        setTimeout(() => checkout.close(), 1500);
      });

      checkout.addEventListener("close", () => {
        // User closed checkout without completing — no action needed
      });

      checkout.addEventListener("confirmed", (event) => {
        // Payment is being processed (not yet confirmed by webhook)
        event.preventDefault();
        toast({
          title: "Payment processing",
          description: "Your payment is being confirmed. Pro features will unlock shortly.",
          variant: "info",
          duration: 5000,
        });
      });
    } catch (error) {
      console.error("Polar embed checkout failed, opening in new tab:", error);
      window.open(url.toString(), "_blank");
    }
  }, [user]);

  return { openCheckout, checkoutUrl };
}
