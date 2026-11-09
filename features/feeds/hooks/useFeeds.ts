"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFeedComment,
  createFeed,
  getFeeds,
  toggleFeedLike,
} from "@/features/feeds/services/feed.service";
import type { AuthUser } from "@/features/auth/types";
import type { Feed } from "@/features/ward/types";

export const FEEDS_QUERY_KEY = ["feeds"] as const;

export function useFeeds(
  authUser: AuthUser | null | undefined,
  isAuthenticated: boolean,
) {
  const queryClient = useQueryClient();
  const feedsQuery = useQuery({ queryKey: FEEDS_QUERY_KEY, queryFn: getFeeds });

  const createMutation = useMutation({
    mutationFn: createFeed,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: FEEDS_QUERY_KEY }),
  });

  const likeMutation = useMutation({
    mutationFn: toggleFeedLike,
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: FEEDS_QUERY_KEY });
      const previous = queryClient.getQueryData<Feed[]>(FEEDS_QUERY_KEY);
      queryClient.setQueryData<Feed[]>(FEEDS_QUERY_KEY, (feeds = []) =>
        feeds.map((feed) =>
          String(feed.id) === String(feedId)
            ? {
                ...feed,
                likedByMe: !feed.likedByMe,
                likes: feed.likedByMe
                  ? Math.max(0, feed.likes - 1)
                  : feed.likes + 1,
              }
            : feed,
        ),
      );
      return { previous };
    },
    onSuccess: (result, feedId) => {
      queryClient.setQueryData<Feed[]>(FEEDS_QUERY_KEY, (feeds = []) =>
        feeds.map((feed) =>
          String(feed.id) === String(feedId)
            ? { ...feed, likedByMe: result.likedByMe, likes: result.likes }
            : feed,
        ),
      );
    },
    onError: (error, _feedId, context) => {
      console.warn("Like sync notice, reverting:", error.message);
      if (context?.previous)
        queryClient.setQueryData(FEEDS_QUERY_KEY, context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: FEEDS_QUERY_KEY }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ feedId, text }: { feedId: string | number; text: string }) =>
      addFeedComment(feedId, {
        author: authUser?.name || "Guest",
        authorAvatar: authUser?.avatar || "/default-avatar.png",
        authorId: authUser?.id || null,
        text,
      }),
    onSuccess: (comment, { feedId }) => {
      queryClient.setQueryData<Feed[]>(FEEDS_QUERY_KEY, (feeds = []) =>
        feeds.map((feed) =>
          String(feed.id) === String(feedId)
            ? { ...feed, comments: [...feed.comments, comment] }
            : feed,
        ),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: FEEDS_QUERY_KEY }),
  });

  return {
    feeds: feedsQuery.data || [],
    isLoadingFeeds: feedsQuery.isLoading,
    refreshFeeds: async () => {
      await feedsQuery.refetch();
    },
    addFeed: async (feed: Partial<Feed>) => {
      try {
        await createMutation.mutateAsync(feed);
        return true;
      } catch (error) {
        console.error("Feed creation failed:", error);
        return false;
      }
    },
    likeFeed: async (feedId: string | number) => {
      if (isAuthenticated) await likeMutation.mutateAsync(feedId);
    },
    addCommentToFeed: async (feedId: string | number, text: string) => {
      await commentMutation.mutateAsync({ feedId, text });
    },
  };
}
