import { describe, expect, it } from "vitest";
import { courseProgress, createDefaultState, move, scoreQuiz } from "./academy";

describe("academy rules", () => {
  it("course progress starts at 0", () => {
    expect(courseProgress(createDefaultState()).percent).toBe(0);
  });
  it("progress counts only published lessons", () => {
    const s = createDefaultState();
    s.lessons.push({ ...s.lessons[0]!, id: "x", published: false });
    s.progress.lessons["sample-lesson"] = "done";
    expect(courseProgress(s)).toEqual({ total: 1, done: 1, percent: 100 });
  });
  it("quiz score counts correct answers", () => {
    const q = { id: "q", title: "", description: "", published: true, questions: [
      { id: "a", text: "", options: ["1", "2"], correct: 1, explanation: "" },
      { id: "b", text: "", options: ["1", "2"], correct: 0, explanation: "" },
    ] };
    expect(scoreQuiz(q, { a: 1, b: 1 })).toBe(1);
  });
  it("reorder swaps neighbours and ignores edges", () => {
    expect(move([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(move([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
  });
});
