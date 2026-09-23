type RollupChild = { progress: number; status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELAYED"; currentEnd: Date };

export function tokyoDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function isPastScheduleDate(value: Date, now = new Date()) {
  return tokyoDateKey(value) < tokyoDateKey(now);
}

export function calculateRollup(children: RollupChild[], now = new Date()) {
  if (!children.length) return null;
  const progress = Math.round(children.reduce((sum, item) => sum + item.progress, 0) / children.length);
  const status = progress === 100
    ? "DONE" as const
    : children.some((item) => item.status === "DELAYED" || (isPastScheduleDate(item.currentEnd, now) && item.progress < 100))
      ? "DELAYED" as const
      : progress > 0 ? "IN_PROGRESS" as const : "NOT_STARTED" as const;
  return { progress, status };
}
