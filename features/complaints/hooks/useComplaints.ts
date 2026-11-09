"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createComplaint, getComplaints, upvoteComplaint } from "@/features/complaints/services/complaint.service";
import type { AddComplaintInput, Complaint } from "@/features/ward/types";

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;

export function useComplaints() {
  const queryClient = useQueryClient();
  const complaintsQuery = useQuery({ queryKey: COMPLAINTS_QUERY_KEY, queryFn: getComplaints });
  const upvoteMutation = useMutation({
    mutationFn: upvoteComplaint,
    onMutate: async (complaintId) => {
      await queryClient.cancelQueries({ queryKey: COMPLAINTS_QUERY_KEY });
      const previous = queryClient.getQueryData<Complaint[]>(COMPLAINTS_QUERY_KEY);
      queryClient.setQueryData<Complaint[]>(COMPLAINTS_QUERY_KEY, (complaints = []) =>
        complaints.map((complaint) => String(complaint.id) === String(complaintId)
          ? { ...complaint, upvotes: complaint.upvotes + 1 }
          : complaint),
      );
      return { previous };
    },
    onError: (error, _complaintId, context) => {
      console.error("Upvote sync error, reverting:", error);
      if (context?.previous) queryClient.setQueryData(COMPLAINTS_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY }),
  });

  return {
    complaints: complaintsQuery.data || [],
    isLoadingComplaints: complaintsQuery.isLoading,
    addComplaint: async (data: AddComplaintInput) => {
      const complaint = await createComplaint(data);
      await queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
      if (data.shareOnFeed) await queryClient.invalidateQueries({ queryKey: ["feeds"] });
      return complaint;
    },
    upvoteComplaint: async (id: string | number) => { await upvoteMutation.mutateAsync(id); },
  };
}
