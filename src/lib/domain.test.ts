import test from "node:test";
import assert from "node:assert/strict";
import { calculateRollup, isPastScheduleDate } from "./domain";

test("終了日当日は作業時刻を過ぎても遅延にしない", () => {
  const now = new Date("2026-09-23T15:00:00+09:00");
  assert.equal(isPastScheduleDate(new Date("2026-09-23T09:00:00+09:00"), now), false);
});

test("子工程の平均進捗を親工程へ集計する", () => {
  const result = calculateRollup([
    { progress: 90, status: "IN_PROGRESS", currentEnd: new Date("2026-09-23T09:00:00+09:00") },
    { progress: 20, status: "IN_PROGRESS", currentEnd: new Date("2026-09-25T09:00:00+09:00") },
    { progress: 0, status: "NOT_STARTED", currentEnd: new Date("2026-09-28T09:00:00+09:00") },
  ], new Date("2026-09-23T15:00:00+09:00"));
  assert.deepEqual(result, { progress: 37, status: "IN_PROGRESS" });
});

test("期限を過ぎた未完了の子工程があれば親工程も遅延にする", () => {
  const result = calculateRollup([
    { progress: 70, status: "IN_PROGRESS", currentEnd: new Date("2026-09-22T18:00:00+09:00") },
    { progress: 100, status: "DONE", currentEnd: new Date("2026-09-21T18:00:00+09:00") },
  ], new Date("2026-09-23T09:00:00+09:00"));
  assert.deepEqual(result, { progress: 85, status: "DELAYED" });
});
