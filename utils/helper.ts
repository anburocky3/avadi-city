export function timeAgo(dateString: string | Date | number): string {
  const date = new Date(dateString);
  const now = new Date();

  // Calculate seconds difference
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates or edge cases
  if (seconds < 0) return "just now";

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1)
    return `${interval} ${interval === 1 ? "year" : "years"} ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1)
    return `${interval} ${interval === 1 ? "month" : "months"} ago`;

  interval = Math.floor(seconds / 86400);
  if (interval >= 1)
    return `${interval} ${interval === 1 ? "day" : "days"} ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} ${interval === 1 ? "hr" : "hrs"} ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return `${interval} ${interval === 1 ? "min" : "mins"} ago`;

  return "just now";
}
