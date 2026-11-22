import { useSyncExternalStore } from "react";

export type LessonStatus = "not_started" | "in_progress" | "done";
export type Accent = "burgundy" | "plum" | "rose" | "emerald";

export interface Module { id: string; title: string; description: string; sample?: boolean }
export interface Resource { id: string; title: string; url: string }
export interface Lesson {
  id: string; moduleId: string | null; title: string; description: string; category: string;
  duration: number; cover: string; videoUrl: string; content: string; resources: Resource[];
  published: boolean; sample?: boolean;
}
export interface Material { id: string; title: string; description: string; category: string; url: string; fileName?: string; fileData?: string; sample?: boolean }
export interface Question { id: string; text: string; options: string[]; correct: number; explanation: string }
export interface Quiz { id: string; title: string; description: string; questions: Question[]; published: boolean }
export interface Announcement { id: string; title: string; body: string; date: string; published: boolean; sample?: boolean }
export interface Activity { id: string; text: string; date: string }
export interface Settings { courseTitle: string; instructor: string; accent: Accent }

export interface AcademyState {
  modules: Module[]; lessons: Lesson[]; materials: Material[]; quizzes: Quiz[]; announcements: Announcement[];
  progress: { lessons: Record<string, LessonStatus>; quizzes: Record<string, { score: number; total: number; date: string }> };
  activity: Activity[]; settings: Settings;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function createDefaultState(): AcademyState {
  const moduleId = "sample-module";
  return {
    modules: [{ id: moduleId, title: "Үлгі модуль", description: "Бұл — үлгі. Өңдеңіз немесе жойыңыз.", sample: true }],
    lessons: [{
      id: "sample-lesson", moduleId, title: "Үлгі сабақ (өңдеуге болады)",
      description: "Бұл сабақ құрылымды көрсету үшін ғана тұр. «Контентті басқару» бөлімінде өз мазмұныңызбен ауыстырыңыз.",
      category: "Үлгі", duration: 5, cover: "", videoUrl: "",
      content: "## Үлгі мәтін\nМұнда сабақ мазмұны болады. Мәтінді **қалың**, *көлбеу* етуге, тізім мен сілтеме қосуға болады.\n\n- Бірінші тармақ\n- Екінші тармақ\n\n[Сілтеме үлгісі](https://example.com)",
      resources: [], published: true, sample: true,
    }],
    materials: [{ id: "sample-material", title: "Үлгі материал", description: "Өз файлыңызды немесе сілтемеңізді қосыңыз.", category: "Үлгі", url: "https://example.com", sample: true }],
    quizzes: [],
    announcements: [{ id: "sample-ann", title: "Үлгі хабарландыру", body: "Оқушыларға арналған жаңалықтарды осында жариялаңыз. Бұл үлгіні өңдеуге не жоюға болады.", date: new Date(0).toISOString(), published: true, sample: true }],
    progress: { lessons: {}, quizzes: {} },
    activity: [],
    settings: { courseTitle: "Kaspi Academy — Banu", instructor: "Бану", accent: "burgundy" },
  };
}

const KEY = "kaspi-academy-banu:v1";
let state: AcademyState | null = null;
let serverState: AcademyState | null = null;
const listeners = new Set<() => void>();

function load(): AcademyState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? { ...createDefaultState(), ...(JSON.parse(raw) as AcademyState) } : createDefaultState();
  } catch { state = createDefaultState(); }
  return state;
}

export function setState(updater: (s: AcademyState) => AcademyState): boolean {
  const next = updater(load());
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { return false; }
  state = next;
  listeners.forEach((l) => l());
  return true;
}

export function resetState() { setState(() => createDefaultState()); }

export function useAcademy(): AcademyState {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    load,
    () => (serverState ??= createDefaultState()),
  );
}

export function logActivity(s: AcademyState, text: string): AcademyState {
  return { ...s, activity: [{ id: uid(), text, date: new Date().toISOString() }, ...s.activity].slice(0, 50) };
}

export function setLessonStatus(id: string, status: LessonStatus, title: string) {
  setState((s) => {
    if (s.progress.lessons[id] === status) return s;
    const n = { ...s, progress: { ...s.progress, lessons: { ...s.progress.lessons, [id]: status } } };
    return status === "done" ? logActivity(n, `«${title}» сабағы аяқталды`) : status === "in_progress" ? logActivity(n, `«${title}» сабағы басталды`) : n;
  });
}

export function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[j]] = [copy[j] as T, copy[index] as T];
  return copy;
}

export function courseProgress(s: AcademyState) {
  const published = s.lessons.filter((l) => l.published);
  const done = published.filter((l) => s.progress.lessons[l.id] === "done").length;
  return { total: published.length, done, percent: published.length ? Math.round((done / published.length) * 100) : 0 };
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, number>) {
  return quiz.questions.filter((q) => answers[q.id] === q.correct).length;
}

export const statusLabel: Record<LessonStatus, string> = { not_started: "Басталмады", in_progress: "Оқуда", done: "Аяқталды" };

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (d.getTime() === 0) return "Үлгі";
  return d.toLocaleDateString("kk-KZ", { day: "numeric", month: "long", year: "numeric" });
}

export function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
