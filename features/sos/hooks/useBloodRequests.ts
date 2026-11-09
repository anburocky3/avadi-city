"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createBloodRequest } from "@/features/sos/services/blood-request.service";

export function useBloodRequests(bloodGroup?: string) {
  const queryClient = useQueryClient();
  return {
    bloodGroup: bloodGroup || "Unknown",
    addBloodRequest: async (request: Partial<{ name: string; bloodGroup: string; contact: string }>) => {
      try {
        await createBloodRequest(request);
        await queryClient.invalidateQueries({ queryKey: ["blood-requests"] });
        return true;
      } catch (error) {
        console.error("Blood request failed:", error);
        return false;
      }
    },
  };
}
