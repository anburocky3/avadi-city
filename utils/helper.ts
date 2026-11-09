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

export const format12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(":")) return time24;
  const [hoursStr, minutesStr] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutesStr} ${ampm}`;
};

export const getChennaiClockTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const getPart = (type: "hour" | "minute" | "second") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    hours: getPart("hour"),
    minutes: getPart("minute"),
    seconds: getPart("second"),
  };
};

export const trainFormatChennaiTime = (date: Date) => {
  const { hours, minutes } = getChennaiClockTime(date);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const trainFormatRelativeTime = (totalMins: number): string => {
  if (totalMins <= 0) return "Departing now";
  if (totalMins < 60) return `in ${totalMins} min${totalMins === 1 ? "" : "s"}`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
};
