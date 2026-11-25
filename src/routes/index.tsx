import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Library, Megaphone, PlayCircle, ShieldAlert, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, SampleBadge } from "@/components/academy/ui";
import { courseProgress, formatDate, useAcademy, visibleLessons } from "@/lib/academy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Басты бет — Kaspi Дүкен Академиясы" },
      { name: "description", content: "Kaspi Магазин курсы: прогресс, жалғастыру және хабарландырулар." },
      { property: "og:title", content: "Kaspi Дүкен Академиясы" },
      { property: "og:description", content: "Kaspi Магазин ашу және басқаруды үйрететін тәуелсіз оқу порталы." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Қайырлы таң" : h < 18 ? "Қайырлы күн" : "Қайырлы кеш";
}

function Dashboard() {
  const s = useAcademy();
  const p = courseProgress(s);
  const published = visibleLessons(s);
  const next = published.find((l) => s.progress.lessons[l.id] === "in_progress") ?? published.find((l) => s.progress.lessons[l.id] !== "done");
  const anns = s.announcements.filter((a) => a.published);
  const quick = [
    { to: "/lessons", label: "Сабақтар", icon: BookOpen },
    { to: "/practice", label: "Практика", icon: Target },
    { to: "/materials", label: "Материалдар", icon: Library },
    { to: "/progress", label: "Менің нәтижем", icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero p-6 text-primary-foreground shadow-[var(--shadow-lift)] md:p-10">
        <div className="absolute -right-16 -top-16 size-56 rounded-full border border-gold/40" />
        <div className="absolute -right-4 top-10 size-32 rounded-full border border-gold/25" />
        <p className="text-sm font-medium text-gold">{greeting()} 👋</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight md:text-5xl">{s.settings.courseTitle}</h1>
        <p className="mt-3 max-w-lg text-sm opacity-85 md:text-base">Kaspi Магазин ашуды және басқаруды қадам-қадаммен үйреніңіз.{s.settings.instructor && ` Жетекші: ${s.settings.instructor}`}</p>
        <div className="mt-6 max-w-md">
          <div className="mb-2 flex justify-between text-sm"><span>Курс прогресі</span><span className="font-bold">{p.percent}%</span></div>
          <Progress value={p.percent} className="h-2.5 bg-primary-foreground/20 [&>div]:bg-gold" />
          <p className="mt-2 text-xs opacity-75">{p.done} / {p.total} сабақ аяқталды</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-xl font-semibold">Оқуды жалғастыру</h2>
          {next ? (
            <Link to="/lessons/$lessonId" params={{ lessonId: next.id }} className="card-surface group flex items-center gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
                {next.cover ? <img src={next.cover} alt="" className="size-full object-cover" /> : <PlayCircle className="size-8" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">{next.sample && <SampleBadge />}<span className="text-xs text-muted-foreground">{next.duration} мин</span></div>
                <h3 className="mt-1 truncate font-sans text-base font-semibold">{next.title}</h3>
                <p className="line-clamp-1 text-sm text-muted-foreground">{next.description}</p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <EmptyState icon={BookOpen} title={published.length ? "Барлық сабақ аяқталды!" : "Сабақтар әлі жоқ"}
              text={published.length ? "Керемет нәтиже. Практикамен біліміңізді бекітіңіз." : "Алғашқы сабақты «Контентті басқару» бөлімінде қосыңыз."}
              action={<Button asChild><Link to={published.length ? "/practice" : "/admin"}>{published.length ? "Практикаға өту" : "Сабақ қосу"}</Link></Button>} />
          )}

          <h2 className="mb-3 mt-8 text-xl font-semibold">Жылдам сілтемелер</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quick.map((q) => (
              <Link key={q.to} to={q.to} className="card-surface flex flex-col items-start gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><q.icon className="size-5" /></span>
                <span className="text-sm font-semibold">{q.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 text-xl font-semibold">Хабарландырулар</h2>
          {anns.length ? (
            <div className="space-y-3">
              {anns.map((a) => (
                <article key={a.id} className="card-surface p-4">
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground"><Megaphone className="size-3.5 text-gold" />{formatDate(a.date)}{a.sample && <SampleBadge />}</div>
                  <h3 className="font-sans font-semibold">{a.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState icon={Megaphone} title="Хабарландыру жоқ" text="Жаңалықтар осында пайда болады." />}
        </section>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-gold/50 bg-gold-soft p-4">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm"><strong>Маңызды:</strong> Бұл сайт — тәуелсіз оқу жобасы. Kaspi.kz компаниясымен ресми байланысы жоқ, оның серіктесі немесе өкілі емес.</p>
      </div>
    </div>
  );
}
