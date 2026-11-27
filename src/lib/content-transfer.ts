import type { AcademyState } from "./academy";

export const CONTENT_KINDS = ["modules", "lessons", "materials", "quizzes", "announcements"] as const;
export type SharedContent = Pick<AcademyState, typeof CONTENT_KINDS[number]>;
export const emptyContent = (): SharedContent => ({ modules: [], lessons: [], materials: [], quizzes: [], announcements: [] });

/** Conflicting legacy IDs are copied, never silently overwritten. Module links follow the copy. */
export function mergeLegacyContent(current: SharedContent, legacy: SharedContent): SharedContent {
  const result = structuredClone(current);
  const moduleIds = new Map<string, string>();
  for (const kind of CONTENT_KINDS) {
    for (const original of legacy[kind]) {
      if ("sample" in original && original.sample) continue;
      const item = structuredClone(original);
      if (kind === "lessons" && "moduleId" in item && item.moduleId) item.moduleId = moduleIds.get(item.moduleId) ?? item.moduleId;
      const list = result[kind] as Array<{ id: string }>;
      const existing = list.find((x) => x.id === item.id);
      if (existing && JSON.stringify(existing) === JSON.stringify(item)) continue;
      if (existing) {
        let n = 1;
        while (list.some((x) => x.id === `${original.id}-import-${n}`)) n++;
        item.id = `${original.id}-import-${n}`;
      }
      if (kind === "modules") moduleIds.set(original.id, item.id);
      list.push(item);
    }
  }
  return result;
}

export function mediaPaths(content: SharedContent): Set<string> {
  return new Set([
    ...content.lessons.flatMap((l) => [l.videoPath, ...l.resources.map((r) => r.path)]),
    ...content.materials.map((m) => m.filePath),
  ].filter((p): p is string => !!p));
}