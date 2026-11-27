import { move, uid, type AcademyState, type Announcement, type Lesson, type Material, type Module, type Question, type Quiz } from "./academy";

export type EntityKind = "modules" | "lessons" | "materials" | "quizzes" | "announcements";
export type Draft =
  | { kind: "modules"; value: Module }
  | { kind: "lessons"; value: Lesson }
  | { kind: "materials"; value: Material }
  | { kind: "quizzes"; value: Quiz }
  | { kind: "announcements"; value: Announcement };

export const MAX_FILE_BYTES = 1024 * 1024;
export const STORAGE_FAILURE = "Сақталмады. Браузер жады толған немесе сақтау бұғатталған. Үлкен файлдарды алып тастап, қайта сақтаңыз. Өзгерістер редакторда қалды.";
export const isHttpUrl = (value: string) => {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
};

export function newQuestion(): Question { return { id: uid(), text: "", options: ["", ""], correct: 0, explanation: "" }; }

export function newDraft(kind: EntityKind): Draft {
  const base = { id: uid(), title: "", published: false };
  switch (kind) {
    case "modules": return { kind, value: { ...base, description: "" } };
    case "lessons": return { kind, value: { ...base, description: "", moduleId: null, category: "", duration: 5, cover: "", videoUrl: "", content: "", resources: [] } };
    case "materials": return { kind, value: { ...base, description: "", category: "", url: "" } };
    case "quizzes": return { kind, value: { ...base, description: "", questions: [newQuestion()] } };
    case "announcements": return { kind, value: { ...base, body: "", date: new Date().toISOString() } };
  }
}

export function validateDraft(draft: Draft, state: AcademyState): string | null {
  if (!draft.value.title.trim()) return "Атауын енгізіңіз.";
  if (draft.kind === "lessons") {
    const l = draft.value;
    if (!l.moduleId || !state.modules.some((m) => m.id === l.moduleId)) return "Сабақ үшін модульді таңдаңыз.";
    if (!Number.isInteger(l.duration) || l.duration < 1) return "Ұзақтығы кемінде 1 минут болуы керек.";
    if ((l.cover.trim() && !isHttpUrl(l.cover.trim())) || (l.videoUrl.trim() && !isHttpUrl(l.videoUrl.trim()))) return "Сурет пен бейне сілтемелері http:// немесе https:// арқылы басталуы керек.";
    if (l.resources.some((r) => !r.title.trim() || (!r.path && !isHttpUrl(r.url.trim())))) return "Әр ресурсқа атау және жарамды сілтеме енгізіңіз.";
  }
  if (draft.kind === "materials") {
    const m = draft.value;
    if (!m.filePath && !m.fileData && !isHttpUrl(m.url.trim())) return "Материалға жарамды сілтеме немесе файл қосыңыз.";
    if (m.url.trim() && !isHttpUrl(m.url.trim())) return "Жарамды http:// немесе https:// сілтемесін енгізіңіз.";
  }
  if (draft.kind === "quizzes") {
    if (!draft.value.questions.length) return "Кемінде бір сұрақ қосыңыз.";
    for (const [i, q] of draft.value.questions.entries()) {
      if (!q.text.trim()) return `${i + 1}-сұрақтың мәтінін енгізіңіз.`;
      if (q.options.length < 2 || q.options.some((o) => !o.trim())) return `${i + 1}-сұраққа кемінде 2 толтырылған жауап нұсқасы қажет.`;
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) return `${i + 1}-сұрақтың дұрыс жауабын таңдаңыз.`;
    }
  }
  if (draft.kind === "announcements" && !draft.value.body.trim()) return "Хабарландыру мәтінін енгізіңіз.";
  return null;
}

function upsert<T extends { id: string }>(list: T[], value: T) {
  return list.some((v) => v.id === value.id) ? list.map((v) => v.id === value.id ? value : v) : [...list, value];
}

export function saveDraft(state: AcademyState, draft: Draft): AcademyState {
  const value = { ...draft.value, title: draft.value.title.trim() };
  switch (draft.kind) {
    case "modules": return { ...state, modules: upsert(state.modules, { ...draft.value, ...value }) };
    case "lessons": return { ...state, lessons: upsert(state.lessons, { ...draft.value, ...value, cover: draft.value.cover.trim(), videoUrl: draft.value.videoUrl.trim(), resources: draft.value.resources.map((r) => ({ ...r, title: r.title.trim(), url: r.url.trim() })) }) };
    case "materials": return { ...state, materials: upsert(state.materials, { ...draft.value, ...value, url: draft.value.url.trim() }) };
    case "quizzes": return { ...state, quizzes: upsert(state.quizzes, { ...draft.value, ...value }) };
    case "announcements": return { ...state, announcements: upsert(state.announcements, { ...draft.value, ...value }) };
  }
}

export function deleteEntity(state: AcademyState, kind: EntityKind, id: string): AcademyState {
  switch (kind) {
    case "modules": return { ...state, modules: state.modules.filter((v) => v.id !== id), lessons: state.lessons.map((l) => l.moduleId === id ? { ...l, moduleId: null } : l) };
    case "lessons": { const lessons = { ...state.progress.lessons }; delete lessons[id]; return { ...state, lessons: state.lessons.filter((v) => v.id !== id), progress: { ...state.progress, lessons } }; }
    case "materials": return { ...state, materials: state.materials.filter((v) => v.id !== id) };
    case "quizzes": { const quizzes = { ...state.progress.quizzes }; delete quizzes[id]; return { ...state, quizzes: state.quizzes.filter((v) => v.id !== id), progress: { ...state.progress, quizzes } }; }
    case "announcements": return { ...state, announcements: state.announcements.filter((v) => v.id !== id) };
  }
}

export function reorderEntity(state: AcademyState, kind: "modules" | "lessons", id: string, direction: -1 | 1): AcademyState {
  return kind === "modules" ? { ...state, modules: move(state.modules, state.modules.findIndex((v) => v.id === id), direction) } : { ...state, lessons: move(state.lessons, state.lessons.findIndex((v) => v.id === id), direction) };
}

export function removeChoice(q: Question, index: number): Question {
  if (q.options.length <= 2) return q;
  return { ...q, options: q.options.filter((_, i) => i !== index), correct: q.correct === index ? 0 : q.correct > index ? q.correct - 1 : q.correct };
}