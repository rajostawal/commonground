"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { useToast } from "@/hooks/useToast";
import { Toast } from "./Toast";
import { Button } from "./Button";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, actionLabel, onAction, ...props }) => (
        <Toast
          key={id}
          title={title}
          description={description}
          variant={variant}
          action={
            onAction && actionLabel ? (
              <RadixToast.Action altText={actionLabel} asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-xs"
                  onClick={onAction}
                >
                  {actionLabel}
                </Button>
              </RadixToast.Action>
            ) : undefined
          }
          {...props}
        />
      ))}
      <RadixToast.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </RadixToast.Provider>
  );
}
