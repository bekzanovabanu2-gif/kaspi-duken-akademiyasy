import { describe, expect, it, vi } from "vitest";
import { createDefaultState, courseProgress, setState, visibleLessons, visibleModules } from "./academy";
import { deleteEntity, newDraft, removeChoice, reorderEntity, saveDraft, validateDraft } from "./academy-editor";

describe("content editor rules", () => {
  it("requires at least 2 quiz choices", () => {
    const d = newDraft("quizzes");
    if (d.kind !== "quizzes") throw new Error("Wrong draft");
    d.value.title = "Test";
    d.value.questions = [{ id: "q", text: "Question", options: ["one"], correct: 0, explanation: "" }];
    expect(validateDraft(d, createDefaultState())).not.toBeNull();
    d.value.questions[0]?.options.push("two");
    expect(validateDraft(d, createDefaultState())).toBeNull();
  });
  it("rejects an out-of-range correct answer", () => {
    const d = newDraft("quizzes");
    if (d.kind !== "quizzes") throw new Error("Wrong draft");
    d.value.title = "Test";
    d.value.questions = [{ id: "q", text: "Question", options: ["one", "two"], correct: 2, explanation: "" }];
    expect(validateDraft(d, createDefaultState())).not.toBeNull();
  });
  it("requires a real module for a lesson", () => {
    const d = newDraft("lessons");
    if (d.kind !== "lessons") throw new Error("Wrong draft");
    d.value.title = "Lesson";
    expect(validateDraft(d, createDefaultState())).not.toBeNull();
    d.value.moduleId = "sample-module";
    expect(validateDraft(d, createDefaultState())).toBeNull();
  });
  it("publishes legacy modules and hides unpublished module lessons", () => {
    const s = createDefaultState();
    expect(visibleModules(s)).toHaveLength(1);
    const module = s.modules[0];
    if (!module) throw new Error("Missing module");
    module.published = false;
    expect(visibleLessons(s)).toHaveLength(0);
    expect(courseProgress(s).total).toBe(0);
  });
  it("deleting a module preserves lessons", () => {
    const next = deleteEntity(createDefaultState(), "modules", "sample-module");
    expect(next.modules).toHaveLength(0);
    expect(next.lessons).toHaveLength(1);
    expect(next.lessons[0]?.moduleId).toBeNull();
  });
  it("saves and reorders modules", () => {
    const d = newDraft("modules"); d.value.title = "New module";
    const saved = saveDraft(createDefaultState(), d);
    expect(saved.modules).toHaveLength(2);
    expect(reorderEntity(saved, "modules", d.value.id, -1).modules[0]?.id).toBe(d.value.id);
  });
  it("keeps correct choice valid when removing an earlier option", () => {
    expect(removeChoice({ id: "q", text: "", options: ["a", "b", "c"], correct: 2, explanation: "" }, 0).correct).toBe(1);
  });
  it("quota failure returns false and preserves previously stored data", () => {
    localStorage.clear();
    expect(setState(() => createDefaultState())).toBe(true);
    const previous = localStorage.getItem("kaspi-academy-banu:v1");
    const mock = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
    expect(setState((s) => ({ ...s, modules: [] }))).toBe(false);
    expect(localStorage.getItem("kaspi-academy-banu:v1")).toBe(previous);
    mock.mockRestore();
  });
});
