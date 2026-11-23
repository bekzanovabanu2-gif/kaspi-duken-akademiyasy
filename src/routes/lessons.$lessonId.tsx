import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LessonView } from "@/components/academy/LessonView";
import { EmptyState, StatusBadge } from "@/components/academy/ui";
import { setLessonStatus, useAcademy, visibleLessons } from "@/lib/academy";

export const Route = createFileRoute("/lessons/$lessonId")({
  head: () => ({ meta: [
    { title: "Сабақ — Kaspi Academy — Banu" },
    { name: "description", content: "Kaspi Магазин курсының сабағы." },
    { property: "og:title", content: "Сабақ — Kaspi Academy" },
    { property: "og:description", content: "Kaspi Магазин курсының сабағы." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const s = useAcademy();
  const published = visibleLessons(s);
  const idx = published.findIndex((l) => l.id === lessonId);
  const lesson = published[idx];
  const status = s.progress.lessons[lessonId] ?? "not_started";

  useEffect(() => {
    if (lesson && (s.progress.lessons[lesson.id] ?? "not_started") === "not_started") setLessonStatus(lesson.id, "in_progress", lesson.title);
  }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) return <EmptyState icon={BookOpen} title="Сабақ табылмады" text="Сабақ жойылған немесе жарияланбаған болуы мүмкін." action={<Button asChild><Link to="/lessons">Сабақтарға оралу</Link></Button>} />;
  const prev = published[idx - 1]; const next = published[idx + 1];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/lessons" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Сабақтар</Link>
        <StatusBadge status={status} />
      </div>
      <LessonView lesson={lesson} moduleTitle={s.modules.find((m) => m.id === lesson.moduleId)?.title} />
      <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        {status === "done" ? (
          <Button variant="outline" onClick={() => { setLessonStatus(lesson.id, "in_progress", lesson.title); toast("Сабақ қайтадан «Оқуда» күйіне өтті"); }}><RotateCcw />Қайта оқу</Button>
        ) : (
          <Button size="lg" onClick={() => { setLessonStatus(lesson.id, "done", lesson.title); toast.success("Сабақ аяқталды! Жарайсыз 🎉"); }}><CheckCircle2 />Аяқталды деп белгілеу</Button>
        )}
        <div className="flex gap-2">
          {prev && <Button variant="ghost" asChild><Link to="/lessons/$lessonId" params={{ lessonId: prev.id }}><ArrowLeft />Алдыңғы</Link></Button>}
          {next && <Button variant="secondary" asChild><Link to="/lessons/$lessonId" params={{ lessonId: next.id }}>Келесі<ArrowRight /></Link></Button>}
        </div>
      </div>
    </div>
  );
}
