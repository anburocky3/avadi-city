"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feed } from "@/types/feed";
import { useAuth } from "../features/auth/hooks/useAuth";

const fetchFeeds = async (): Promise<Feed[]> => {
  const res = await fetch("/api/feeds", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load feeds");
  const data = await res.json();
  return data.map((item: any) => ({
    ...item,
    likes: item.likesCount ?? item.likes ?? 0,
    likedByMe: Boolean(item.likedByMe),
    comments: item.comments || [],
  }));
};

export const useFeeds = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();

  const {
    data: feeds = [],
    isLoading: isLoadingFeeds,
    refetch: refreshFeeds,
  } = useQuery<Feed[]>({
    queryKey: ["feeds"],
    queryFn: fetchFeeds,
  });

  const likeMutation = useMutation({
    mutationFn: async (feedId: string | number) => {
      const res = await fetch(`/api/feeds/${feedId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Like sync failed");
      return res.json();
    },
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: ["feeds"] });
      const previousFeeds = queryClient.getQueryData<Feed[]>(["feeds"]);

      queryClient.setQueryData<Feed[]>(["feeds"], (old = []) =>
        old.map((f) => {
          if (String(f.id) === String(feedId)) {
            const liked = !f.likedByMe;
            return {
              ...f,
              likedByMe: liked,
              likes: liked ? f.likes + 1 : Math.max(0, f.likes - 1),
            };
          }
          return f;
        }),
      );
      return { previousFeeds };
    },
    onError: (err, feedId, context) => {
      if (context?.previousFeeds)
        queryClient.setQueryData(["feeds"], context.previousFeeds);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feeds"] }),
  });

  const commentMutation = useMutation({
    mutationFn: async ({
      feedId,
      text,
    }: {
      feedId: string | number;
      text: string;
    }) => {
      const res = await fetch(`/api/feeds/${feedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: authUser?.name || "Avadi Resident",
          authorAvatar: authUser?.avatar || "/default-avatar.png",
          authorId: authUser?.id || null,
          text,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: (newComment, variables) => {
      queryClient.setQueryData<Feed[]>(["feeds"], (old = []) =>
        old.map((f) =>
          String(f.id) === String(variables.feedId)
            ? { ...f, comments: [...(f.comments || []), newComment] }
            : f,
        ),
      );
    },
  });

  return {
    feeds,
    isLoadingFeeds,
    refreshFeeds,
    likeFeed: likeMutation.mutate,
    addCommentToFeed: (feedId: string | number, text: string) =>
      commentMutation.mutate({ feedId, text }),
  };
};
