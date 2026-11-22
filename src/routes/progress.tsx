import { createFileRoute } from "@tanstack/react-router";
import { Activity, BookOpen, CheckCircle2, Loader, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, StatCard } from "@/components/academy/ui";
import { courseProgress, useAcademy } from "@/lib/academy";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [
    { title: "Менің нәтижем — Kaspi Academy — Banu" },
    { name: "description", content: "Оқу прогресі, тест нәтижелері және соңғы әрекеттер." },
    { property: "og:title", content: "Менің нәтижем — Kaspi Academy" },
    { property: "og:description", content: "Оқу прогресі мен нәтижелер." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ProgressPage,
});

function ProgressPage() {
  const s = useAcademy();
  const p = courseProgress(s);
  const inProg = s.lessons.filter((l) => l.published && s.progress.lessons[l.id] === "in_progress").length;
  const results = Object.values(s.progress.quizzes);
  const avg = results.length ? Math.round((results.reduce((a, r) => a + r.score / r.total, 0) / results.length) * 100) : 0;
  return (
    <div>
      <PageHeader title="Менің нәтижем" subtitle="Прогресіңіз осы құрылғыда сақталады." />
      <div className="card-surface mb-6 p-6">
        <div className="mb-2 flex justify-between"><span className="font-semibold">Жалпы прогресс</span><span className="font-display text-2xl font-semibold text-primary">{p.percent}%</span></div>
        <Progress value={p.percent} className="h-3" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Барлық сабақ" value={p.total} />
        <StatCard icon={CheckCircle2} label="Аяқталды" value={p.done} />
        <StatCard icon={Loader} label="Оқуда" value={inProg} />
        <StatCard icon={Target} label="Тест орташасы" value={results.length ? `${avg}%` : "—"} />
      </div>
      <h2 className="mb-3 text-xl font-semibold">Соңғы әрекеттер</h2>
      {s.activity.length === 0 ? <EmptyState icon={Activity} title="Әзірге әрекет жоқ" text="Сабақ бастағанда немесе тест тапсырғанда осында жазылады." /> : (
        <ul className="card-surface divide-y">
          {s.activity.slice(0, 20).map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3.5 text-sm"><span className="size-2 rounded-full bg-gold" /><span className="flex-1">{a.text}</span>
              <time className="text-xs text-muted-foreground">{new Date(a.date).toLocaleString("kk-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time></li>
          ))}
        </ul>
      )}
    </div>
  );
}
