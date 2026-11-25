import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, FolderKanban, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, SampleBadge } from "@/components/academy/ui";
import { useAcademy, visibleModules, visibleLessons } from "@/lib/academy";

export const Route = createFileRoute("/modules")({
  head: () => ({ meta: [
    { title: "Модульдер — Kaspi Дүкен Академиясы" },
    { name: "description", content: "Курс модульдері және әр модульдегі прогресс." },
    { property: "og:title", content: "Модульдер — Kaspi Академия" },
    { property: "og:description", content: "Курс модульдері және прогресс." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Modules,
});

function Modules() {
  const s = useAcademy();
  if (!visibleModules(s).length) return (<><PageHeader title="Модульдер" /><EmptyState icon={FolderKanban} title="Модуль жоқ" text="Сабақтарды топтау үшін модуль қосыңыз." action={<Button asChild><Link to="/admin">Модуль қосу</Link></Button>} /></>);
  return (
    <div>
      <PageHeader title="Модульдер" subtitle="Курс тақырыптар бойынша модульдерге бөлінген." />
      <div className="space-y-4">
        {visibleModules(s).map((m, i) => {
          const lessons = visibleLessons(s).filter((l) => l.moduleId === m.id);
          const done = lessons.filter((l) => s.progress.lessons[l.id] === "done").length;
          const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
          return (
            <section key={m.id} className="card-surface p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-hero font-display text-xl text-primary-foreground">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{m.title}</h2>{m.sample && <SampleBadge />}</div>
                  {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                  <div className="mt-3 flex items-center gap-3"><Progress value={pct} className="h-2 flex-1" /><span className="text-xs font-semibold">{done}/{lessons.length}</span></div>
                </div>
              </div>
              {lessons.length > 0 ? (
                <ul className="mt-4 divide-y border-t">
                  {lessons.map((l) => {
                    const st = s.progress.lessons[l.id] ?? "not_started";
                    return (
                      <li key={l.id}><Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className="flex items-center gap-3 py-3 text-sm hover:text-primary">
                        {st === "done" ? <CheckCircle2 className="size-5 text-success" /> : st === "in_progress" ? <Loader className="size-5 text-gold" /> : <Circle className="size-5 text-muted-foreground" />}
                        <span className="flex-1 font-medium">{l.title}</span><span className="text-xs text-muted-foreground">{l.duration} мин</span>
                      </Link></li>
                    );
                  })}
                </ul>
              ) : <p className="mt-4 border-t pt-4 text-sm italic text-muted-foreground">Бұл модульде жарияланған сабақ жоқ.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
