import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Clock, PlayCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SampleBadge, StatusBadge } from "@/components/academy/ui";
import { useAcademy, visibleLessons, visibleModules, type LessonStatus } from "@/lib/academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lessons/")({
  head: () => ({ meta: [
    { title: "Сабақтар — Kaspi Дүкен Академиясы" },
    { name: "description", content: "Kaspi Магазин бойынша барлық сабақтар: іздеу және сүзгілер." },
    { property: "og:title", content: "Сабақтар — Kaspi Академия" },
    { property: "og:description", content: "Kaspi Магазин бойынша барлық сабақтар." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Lessons,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{children}</button>;
}

function Lessons() {
  const s = useAcademy();
  const [q, setQ] = useState(""); const [mod, setMod] = useState("all"); const [cat, setCat] = useState("all"); const [st, setSt] = useState<"all" | LessonStatus>("all");
  const published = visibleLessons(s);
  const cats = [...new Set(published.map((l) => l.category).filter(Boolean))];
  const list = useMemo(() => published.filter((l) => {
    const status = s.progress.lessons[l.id] ?? "not_started";
    return (mod === "all" || l.moduleId === mod) && (cat === "all" || l.category === cat) && (st === "all" || status === st)
      && (l.title + " " + l.description).toLowerCase().includes(q.toLowerCase());
  }), [published, mod, cat, st, q, s.progress.lessons]);

  return (
    <div>
      <PageHeader title="Сабақтар" subtitle="Модуль, санат немесе мәртебе бойынша сүзіп, керек сабақты табыңыз." />
      {published.length === 0 ? (
        <EmptyState icon={BookOpen} title="Жарияланған сабақ жоқ" text="Сабақтарды «Контентті басқару» бөлімінде қосып, жариялаңыз." action={<Button asChild><Link to="/admin">Сабақ қосу</Link></Button>} />
      ) : (
        <>
          <div className="relative mb-4"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Сабақ іздеу..." className="h-11 rounded-xl bg-card pl-10" /></div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <Chip active={mod === "all"} onClick={() => setMod("all")}>Барлық модуль</Chip>
            {visibleModules(s).map((m) => <Chip key={m.id} active={mod === m.id} onClick={() => setMod(m.id)}>{m.title}</Chip>)}
          </div>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {(["all", "not_started", "in_progress", "done"] as const).map((v) => <Chip key={v} active={st === v} onClick={() => setSt(v)}>{{ all: "Барлығы", not_started: "Басталмады", in_progress: "Оқуда", done: "Аяқталды" }[v]}</Chip>)}
            {cats.length > 0 && <span className="mx-1 w-px shrink-0 bg-border" />}
            {cats.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? "all" : c)}>#{c}</Chip>)}
          </div>
          {list.length === 0 ? <EmptyState icon={Search} title="Ештеңе табылмады" text="Сүзгілерді өзгертіп немесе басқа сөзбен іздеп көріңіз." /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((l) => (
                <Link key={l.id} to="/lessons/$lessonId" params={{ lessonId: l.id }} className="card-surface group overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
                  <div className="grid aspect-[16/9] place-items-center bg-primary-soft text-primary">
                    {l.cover ? <img src={l.cover} alt="" className="size-full object-cover" /> : <PlayCircle className="size-10 opacity-70" />}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge status={s.progress.lessons[l.id] ?? "not_started"} />{l.sample && <SampleBadge />}</div>
                    <h3 className="font-sans text-base font-semibold group-hover:text-primary">{l.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{l.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="size-3.5" />{l.duration} мин</span>{l.category && <span>#{l.category}</span>}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
