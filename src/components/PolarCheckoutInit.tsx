"use client";

import { useEffect } from "react";

export function PolarCheckoutInit() {
  useEffect(() => {
    import("@polar-sh/checkout/embed").then(({ PolarEmbedCheckout }) => {
      PolarEmbedCheckout.init();
    });
  }, []);

  return null;
}
