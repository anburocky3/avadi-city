"use client";

import { useCallback } from "react";
import { toast as toastHelper } from "@/utils/toast";

export default function useToast() {
  const show = useCallback((message: string, opts?: { duration?: number }) => {
    toastHelper.show(message, opts);
  }, []);

  const success = useCallback(
    (message: string, opts?: { duration?: number }) => {
      toastHelper.success(message, opts);
    },
    [],
  );

  const error = useCallback((message: string, opts?: { duration?: number }) => {
    toastHelper.error(message, opts);
  }, []);

  const info = useCallback((message: string, opts?: { duration?: number }) => {
    toastHelper.info(message, opts);
  }, []);

  return { show, success, error, info } as const;
}
