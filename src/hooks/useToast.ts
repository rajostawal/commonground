"use client";

import { useCallback, useSyncExternalStore } from "react";
import { type VariantProps } from "class-variance-authority";
import { type toastVariants } from "@/components/ui/Toast";

export interface ToastData extends VariantProps<typeof toastVariants> {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

// Singleton store for toasts (shared across all components)
type ToastStore = {
  toasts: ToastData[];
  listeners: Set<() => void>;
};

const store: ToastStore = {
  toasts: [],
  listeners: new Set(),
};

function notify() {
  store.listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  store.listeners.add(callback);
  return () => store.listeners.delete(callback);
}

function getSnapshot(): ToastData[] {
  return store.toasts;
}

export function toast(data: Omit<ToastData, "id">) {
  const id = Math.random().toString(36).slice(2);
  store.toasts = [...store.toasts, { ...data, id }];
  notify();

  const duration = data.duration ?? 4000;
  if (duration > 0) {
    setTimeout(() => {
      store.toasts = store.toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  }

  return id;
}

export function dismissToast(id: string) {
  store.toasts = store.toasts.filter((t) => t.id !== id);
  notify();
}

export function useToast() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addToast = useCallback((data: Omit<ToastData, "id">) => {
    return toast(data);
  }, []);

  return { toasts, toast: addToast, dismiss: dismissToast };
}
