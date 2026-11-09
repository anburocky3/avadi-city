"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createVolunteer } from "@/features/volunteers/services/volunteer.service";

export function useVolunteers() {
  const queryClient = useQueryClient();
  return {
    volunteers: [] as Array<{ name: string; [key: string]: any }>,
    addVolunteer: async (volunteer: Partial<{ name: string; [key: string]: any }>) => {
      try {
        await createVolunteer(volunteer);
        await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
        return true;
      } catch (error) {
        console.error("Volunteer request failed:", error);
        return false;
      }
    },
  };
}
