"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Complaint } from "@/types/complaint";

const fetchComplaints = async (): Promise<Complaint[]> => {
  const res = await fetch("/api/complaints", { credentials: "include" });
  if (!res.ok) return [];
  return res.json();
};

export const useComplaints = () => {
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery<
    Complaint[]
  >({
    queryKey: ["complaints"],
    queryFn: fetchComplaints,
  });

  const upvoteMutation = useMutation({
    mutationFn: async (complaintId: string | number) => {
      const res = await fetch(`/api/complaints/${complaintId}/upvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Upvote sync failed");
      return res.json();
    },
    onMutate: async (complaintId) => {
      await queryClient.cancelQueries({ queryKey: ["complaints"] });
      const previousComplaints = queryClient.getQueryData<Complaint[]>([
        "complaints",
      ]);

      queryClient.setQueryData<Complaint[]>(["complaints"], (old = []) =>
        old.map((c) =>
          String(c.id) === String(complaintId)
            ? { ...c, upvotes: c.upvotes + 1 }
            : c,
        ),
      );
      return { previousComplaints };
    },
    onError: (err, complaintId, context) => {
      if (context?.previousComplaints)
        queryClient.setQueryData(["complaints"], context.previousComplaints);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });

  const addComplaintMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "images" && value !== undefined)
          formData.append(key, String(value));
      });
      if (data.images) {
        data.images
          .slice(0, 3)
          .forEach((file: File) => formData.append("images", file));
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to submit grievance report");
      return result.complaint;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });

  return {
    complaints,
    isLoadingComplaints,
    upvoteComplaint: upvoteMutation.mutate,
    addComplaint: addComplaintMutation.mutateAsync,
  };
};
