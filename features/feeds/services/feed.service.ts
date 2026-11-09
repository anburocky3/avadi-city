import type { Comment, Feed } from "@/features/ward/types";

async function responseData<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
  return data as T;
}

export async function getFeeds(): Promise<Feed[]> {
  const response = await fetch("/api/feeds", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const feeds = await responseData<Feed[]>(response, "Failed to load community feeds");
  return feeds.map((feed) => ({
    ...feed,
    likes: (feed as Feed & { likesCount?: number }).likesCount ?? feed.likes ?? 0,
    likedByMe: Boolean(feed.likedByMe),
    comments: feed.comments || [],
  }));
}

export async function createFeed(feed: Partial<Feed>): Promise<void> {
  const response = await fetch("/api/feeds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feed),
  });
  await responseData(response, "Failed to publish feed");
}

export async function toggleFeedLike(feedId: string | number): Promise<{ likedByMe: boolean; likes: number }> {
  const response = await fetch(`/api/feeds/${feedId}/like`, { method: "POST" });
  return responseData(response, "Database like sync failed");
}

export async function addFeedComment(
  feedId: string | number,
  payload: { author: string; authorAvatar: string; authorId: string | null; text: string },
): Promise<Comment> {
  const response = await fetch(`/api/feeds/${feedId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return responseData<Comment>(response, "Failed to post comment");
}
