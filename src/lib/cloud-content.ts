import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyCloudContent, getAcademyState, type Lesson, type Module, type Resource } from "./academy";
import { CONTENT_KINDS, emptyContent, mediaPaths, mergeLegacyContent, type SharedContent } from "./content-transfer";
import type { Json } from "@/integrations/supabase/types";

export const MEDIA_BUCKET = "lesson-media";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_RESOURCE_BYTES = MAX_VIDEO_BYTES;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const LEGACY_KEY = "kaspi-academy:legacy-content";
const BACKUP_KEY = "kaspi-academy:legacy-content-v2";
const ARCHIVE_KEY = "kaspi-academy:imported-backup";
let version: number | null = null;
let hydrated = false;
let requestSequence = 0;
let saving = false;

export function videoProblem(file: { name: string; type: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!VIDEO_TYPES.includes(file.type) && !["mp4", "mov", "webm"].includes(ext)) return "Тек MP4, MOV немесе WEBM бейнелерін жүктеуге болады.";
  if (file.size > MAX_VIDEO_BYTES) return "Бейне көлемі 50 МБ-тан аспауы керек. Бейнені қысып, қайта жүктеңіз.";
  if (file.size === 0) return "Файл бос.";
  return null;
}
export function mediaContentType(file: { name: string; type: string }, folder: "videos" | "files") {
  if (folder === "videos") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : ext === "mp4" ? "video/mp4" : file.type;
  }
  return file.type || "application/octet-stream";
}

type ModuleRow = { id: string; title: string; description: string; published: boolean };
type LessonRow = { id: string; module_id: string | null; title: string; description: string; category: string; duration: number; cover: string; video_url: string; video_path: string | null; video_name: string | null; content: string; resources: unknown; published: boolean };
const toModule = (r: ModuleRow): Module => ({ id: r.id, title: r.title, description: r.description, published: r.published });
const toLesson = (r: LessonRow): Lesson => ({ id: r.id, moduleId: r.module_id, title: r.title, description: r.description, category: r.category, duration: r.duration, cover: r.cover, videoUrl: r.video_url, content: r.content, resources: Array.isArray(r.resources) ? r.resources as Resource[] : [], published: r.published, ...(r.video_path ? { videoPath: r.video_path, videoName: r.video_name ?? "Бейне" } : {}) });

function readBackup(raw: string | null): SharedContent {
  if (!raw) return emptyContent();
  const value = JSON.parse(raw) as Partial<SharedContent>;
  const result = emptyContent();
  for (const kind of CONTENT_KINDS) {
    if (value[kind] !== undefined && !Array.isArray(value[kind])) throw new Error("INVALID_BACKUP");
    (result[kind] as unknown[]) = value[kind] ?? [];
  }
  return result;
}
function captureLegacy() {
  if (localStorage.getItem(BACKUP_KEY) !== null) return;
  const own = emptyContent(); const current = getAcademyState();
  for (const kind of CONTENT_KINDS) (own[kind] as unknown[]) = current[kind].filter((x) => !("sample" in x && x.sample));
  const old = readBackup(localStorage.getItem(LEGACY_KEY));
  localStorage.setItem(BACKUP_KEY, JSON.stringify(mergeLegacyContent(own, old)));
}
export function legacyContent(): SharedContent { return readBackup(localStorage.getItem(BACKUP_KEY)); }
export function clearLegacy() {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (backup) localStorage.setItem(ARCHIVE_KEY, backup);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(emptyContent()));
  // Keep the old key intact as an additional recovery copy.
}

/** A single database statement reads a consistent, RLS-filtered snapshot. Back up before replacing browser data. */
export async function hydrateFromCloud(): Promise<boolean> {
  const sequence = ++requestSequence;
  try {
    captureLegacy();
    const { data, error } = await supabase.rpc("get_academy_content");
    if (error || !data || sequence !== requestSequence || saving) return false;
    const snapshot = data as unknown as SharedContent & { version: number; modules: ModuleRow[]; lessons: LessonRow[] };
    const content: SharedContent = { modules: snapshot.modules.map(toModule), lessons: snapshot.lessons.map(toLesson), materials: snapshot.materials, quizzes: snapshot.quizzes, announcements: snapshot.announcements };
    version = snapshot.version; hydrated = true;
    applyCloudContent(content);
    return true;
  } catch { return false; }
}

/** Atomic, version-checked cloud save. No cache update or success until the transaction commits. */
export async function pushContent(content: SharedContent): Promise<string | null> {
  if (!hydrated || version === null) return "Контент жүктелмеді. Бетті жаңартып, қайта көріңіз.";
  if (saving) return "Алдыңғы сақтау аяқталғанша күтіңіз.";
  saving = true; ++requestSequence;
  try {
    const { data, error } = await supabase.rpc("save_academy_content", { _content: content as unknown as Json, _version: version });
    if (error) return error.message.includes("CONTENT_CONFLICT") ? "Контент басқа құрылғыда өзгертілді. Өзгерістеріңіз редакторда қалды. Бетті жаңартып, соңғы нұсқамен қайта сақтаңыз." : "Бұлтқа сақталмады. Интернетті және әкімші рұқсатын тексеріп, қайта сақтаңыз. Өзгерістер редакторда қалды.";
    version = data;
    applyCloudContent(content);
    return null;
  } catch { return "Желі үзілді. Өзгерістер редакторда қалды; қайта сақтап көріңіз."; }
  finally { saving = false; }
}

export async function uploadMedia(file: File, folder: "videos" | "files", onProgress: (pct: number) => void, signal?: AbortSignal): Promise<string> {
  const problem = folder === "videos" ? videoProblem(file) : file.size === 0 ? "Файл бос." : file.size > MAX_RESOURCE_BYTES ? "Файл көлемі 50 МБ-тан аспауы керек." : null;
  if (problem) throw new Error(problem);
  if (signal?.aborted) throw new Error("Жүктеу тоқтатылды.");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Жүктеу үшін қайта кіріңіз.");
  const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80) || "file";
  const path = `${folder}/${crypto.randomUUID()}-${safe}`;
  const url = `${import.meta.env['VITE_SUPABASE_URL']}/storage/v1/object/${MEDIA_BUCKET}/${path}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener("abort", abort);
    xhr.open("POST", url); xhr.timeout = 15 * 60 * 1000;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", mediaContentType(file, folder));
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.min(99, Math.round(e.loaded / e.total * 100))); };
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      if (xhr.status === 413) return reject(new Error("Файл тым үлкен (ең көбі 50 МБ)."));
      if (xhr.status === 401 || xhr.status === 403) return reject(new Error("Жүктеуге рұқсат жоқ. Әкімші ретінде кіріңіз."));
      if (xhr.status === 400 || xhr.status === 415) return reject(new Error("Файл пішімі қабылданбады. MP4, MOV, WEBM немесе қолдау көрсетілетін құжатты таңдаңыз."));
      reject(new Error("Жүктеу сәтсіз аяқталды. Қайталап көріңіз."));
    };
    xhr.onerror = () => { cleanup(); reject(new Error("Желі қатесі. Интернетті тексеріп, файлды қайта таңдаңыз.")); };
    xhr.ontimeout = () => { cleanup(); reject(new Error("Жүктеу уақыты аяқталды. Файлды қайта таңдаңыз.")); };
    xhr.onabort = () => { cleanup(); reject(new Error("Жүктеу тоқтатылды. Файл сақталмады.")); };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) { cleanup(); reject(new Error("Жүктеу тоқтатылды.")); return; }
    xhr.send(file);
  });
  onProgress(100); return path;
}
export async function deleteMedia(path: string) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw new Error("Файлды қоймадан жою мүмкін болмады.");
}
export async function cleanupRemovedMedia(before: SharedContent, after: SharedContent) {
  const retained = mediaPaths(after);
  await Promise.all([...mediaPaths(before)].filter((p) => !retained.has(p)).map(deleteMedia));
}
export function useMediaUrl(path: string | undefined) {
  const [result, setResult] = useState<{ path: string | undefined; url: string | null; failed: boolean }>({ path: undefined, url: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    const load = async () => {
      setResult({ path, url: null, failed: false });
      try {
        const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60 * 60);
        if (live) setResult({ path, url: data?.signedUrl ?? null, failed: !!error || !data });
      } catch { if (live) setResult({ path, url: null, failed: true }); }
    };
    void load();
    const timer = window.setInterval(() => void load(), 50 * 60 * 1000);
    return () => { live = false; window.clearInterval(timer); };
  }, [path, attempt]);
  return { url: result.path === path ? result.url : null, failed: result.path === path && result.failed, retry: () => setAttempt((n) => n + 1) };
}
export async function openMedia(path: string) {
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, 60 * 10);
  if (error || !data) throw new Error("Файл табылмады немесе қолжетімсіз.");
  window.open(data.signedUrl, "_blank", "noopener");
}

type AdminStatus = { loading: boolean; email: string | null; admin: boolean };
let adminStatus: AdminStatus = { loading: true, email: null, admin: false };
const adminListeners = new Set<() => void>();
const serverAdminStatus: AdminStatus = { loading: true, email: null, admin: false };
export async function refreshAdmin() {
  adminStatus = { loading: true, email: null, admin: false }; adminListeners.forEach((l) => l());
  try {
    const { data } = await supabase.auth.getUser(); const user = data.user;
    const role = user ? await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }) : null;
    adminStatus = { loading: false, email: user?.email ?? null, admin: role?.data === true };
  } catch { adminStatus = { loading: false, email: null, admin: false }; }
  adminListeners.forEach((l) => l());
}
export function useAdmin() {
  return useSyncExternalStore((cb) => { adminListeners.add(cb); return () => { adminListeners.delete(cb); }; }, () => adminStatus, () => serverAdminStatus);
}
