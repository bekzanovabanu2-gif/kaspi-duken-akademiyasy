import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setState, type AcademyState, type Lesson, type Module, type Resource } from "./academy";

export const MEDIA_BUCKET = "lesson-media";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const LEGACY_KEY = "kaspi-academy:legacy-content";

export function videoProblem(file: { name: string; type: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!VIDEO_TYPES.includes(file.type) && !["mp4", "mov", "webm"].includes(ext)) return "Тек MP4, MOV немесе WEBM бейнелерін жүктеуге болады.";
  if (file.size > MAX_VIDEO_BYTES) return "Бейне көлемі 50 МБ-тан аспауы керек. Бейнені қысып, қайта жүктеңіз.";
  if (file.size === 0) return "Файл бос.";
  return null;
}

type ModuleRow = { id: string; title: string; description: string; published: boolean; position: number };
type LessonRow = { id: string; module_id: string | null; title: string; description: string; category: string; duration: number; cover: string; video_url: string; video_path: string | null; video_name: string | null; content: string; resources: unknown; published: boolean; position: number };

const toModule = (r: ModuleRow): Module => ({ id: r.id, title: r.title, description: r.description, published: r.published });
const toLesson = (r: LessonRow): Lesson => {
  const l: Lesson = { id: r.id, moduleId: r.module_id, title: r.title, description: r.description, category: r.category, duration: r.duration, cover: r.cover, videoUrl: r.video_url, content: r.content, resources: Array.isArray(r.resources) ? (r.resources as Resource[]) : [], published: r.published };
  if (r.video_path) { l.videoPath = r.video_path; l.videoName = r.video_name ?? "Бейне"; }
  return l;
};

/** Loads shared modules/lessons from the cloud and makes them the source of truth. */
export async function hydrateFromCloud(): Promise<boolean> {
  const [m, l] = await Promise.all([
    supabase.from("academy_modules").select("*").order("position"),
    supabase.from("academy_lessons").select("*").order("position"),
  ]);
  if (m.error || l.error) return false;
  setState((s) => {
    if (typeof localStorage !== "undefined" && !localStorage.getItem(LEGACY_KEY)) {
      const own = { modules: s.modules.filter((x) => !x.sample), lessons: s.lessons.filter((x) => !x.sample) };
      try { localStorage.setItem(LEGACY_KEY, JSON.stringify(own)); } catch { /* ignore */ }
    }
    return { ...s, modules: (m.data as ModuleRow[]).map(toModule), lessons: (l.data as LessonRow[]).map(toLesson) };
  });
  return true;
}

export function legacyContent(): { modules: Module[]; lessons: Lesson[] } {
  try { const raw = localStorage.getItem(LEGACY_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return { modules: [], lessons: [] };
}
export function clearLegacy() { try { localStorage.setItem(LEGACY_KEY, JSON.stringify({ modules: [], lessons: [] })); } catch { /* ignore */ } }

/** Mirrors local modules/lessons (including order) to the cloud; removes deleted rows. */
export async function pushContent(s: Pick<AcademyState, "modules" | "lessons">): Promise<string | null> {
  const modules = s.modules.map((m, i) => ({ id: m.id, title: m.title, description: m.description, published: m.published !== false, position: i, updated_at: new Date().toISOString() }));
  const lessons = s.lessons.map((l, i) => ({ id: l.id, module_id: l.moduleId, title: l.title, description: l.description, category: l.category, duration: l.duration, cover: l.cover, video_url: l.videoUrl, video_path: l.videoPath ?? null, video_name: l.videoName ?? null, content: l.content, resources: l.resources, published: l.published, position: i, updated_at: new Date().toISOString() }));
  if (modules.length) { const { error } = await supabase.from("academy_modules").upsert(modules); if (error) return error.message; }
  if (lessons.length) { const { error } = await supabase.from("academy_lessons").upsert(lessons as never); if (error) return error.message; }
  const keepM = modules.map((m) => m.id); const keepL = lessons.map((l) => l.id);
  const dm = keepM.length ? supabase.from("academy_modules").delete().not("id", "in", `(${keepM.map((x) => `"${x}"`).join(",")})`) : supabase.from("academy_modules").delete().neq("id", "");
  const dl = keepL.length ? supabase.from("academy_lessons").delete().not("id", "in", `(${keepL.map((x) => `"${x}"`).join(",")})`) : supabase.from("academy_lessons").delete().neq("id", "");
  const [a, b] = await Promise.all([dm, dl]);
  return a.error?.message ?? b.error?.message ?? null;
}

/** Uploads a file to cloud storage with progress. Returns the storage path. */
export async function uploadMedia(file: File, folder: "videos" | "files", onProgress: (pct: number) => void, signal?: AbortSignal): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Жүктеу үшін қайта кіріңіз.");
  const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80) || "file";
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const url = `${import.meta.env['VITE_SUPABASE_URL']}/storage/v1/object/${MEDIA_BUCKET}/${path}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      if (xhr.status === 413) return reject(new Error("Файл тым үлкен (ең көбі 50 МБ)."));
      if (xhr.status === 401 || xhr.status === 403) return reject(new Error("Жүктеуге рұқсат жоқ. Әкімші ретінде кіріңіз."));
      reject(new Error("Жүктеу сәтсіз аяқталды. Қайталап көріңіз."));
    };
    xhr.onerror = () => reject(new Error("Желі қатесі. Интернетті тексеріп, қайталаңыз."));
    xhr.onabort = () => reject(new Error("Жүктеу тоқтатылды."));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
  onProgress(100);
  return path;
}

export async function deleteMedia(path: string) { await supabase.storage.from(MEDIA_BUCKET).remove([path]); }

export function useMediaUrl(path: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let live = true; setFailed(false);
    supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60 * 60 * 6).then(({ data, error }) => {
      if (!live) return; if (error || !data) setFailed(true); else setUrl(data.signedUrl);
    });
    return () => { live = false; };
  }, [path]);
  return { url, failed };
}

export async function openMedia(path: string) {
  const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60 * 10);
  if (data) window.open(data.signedUrl, "_blank", "noopener");
}

export function useAdmin() {
  const [status, setStatus] = useState<{ loading: boolean; email: string | null; admin: boolean }>({ loading: true, email: null, admin: false });
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { if (live) setStatus({ loading: false, email: null, admin: false }); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (live) setStatus({ loading: false, email: user.email ?? null, admin: !!isAdmin });
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_IN" || e === "SIGNED_OUT") void check(); });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);
  return status;
}
