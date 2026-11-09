"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getLocalServiceProfile,
  registerLocalServiceProfile,
} from "@/features/local-services/services/local-service.service";

export function useLocalServices() {
  const queryClient = useQueryClient();
  return {
    getLocalServiceProfile,
    registerLocalServiceProfile: async (data: any) => {
      try {
        await registerLocalServiceProfile(data);
        await queryClient.invalidateQueries({ queryKey: ["services"] });
        return true;
      } catch (error) {
        console.error("Service registration failed:", error);
        throw error;
      }
    },
  };
}
