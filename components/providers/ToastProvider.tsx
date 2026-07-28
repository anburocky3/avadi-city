"use client";

import * as React from "react";
import ToastContainer from "@/components/Toast";
import { toastEmitter } from "@/utils/toast";

type InternalToast = {
  id: string | number;
  message: string;
  type?: "info" | "success" | "error";
};

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  React.useEffect(() => {
    const timeouts: number[] = [];
    const listener = (t: {
      message: string;
      type?: string;
      duration?: number;
    }) => {
      const id = Date.now() + Math.random();
      const toast = { id, message: t.message, type: t.type } as InternalToast;
      setToasts((s) => [toast, ...s]);

      if (t.duration !== 0) {
        const timeoutId = window.setTimeout(() => {
          setToasts((s) => s.filter((x) => x.id !== id));
        }, t.duration ?? 4000);
        timeouts.push(timeoutId);
      }
    };

    const unsub = toastEmitter.on(listener);

    return () => {
      unsub();
      timeouts.forEach((tId) => window.clearTimeout(tId));
    };
  }, []);

  const remove = React.useCallback((id: string | number) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
