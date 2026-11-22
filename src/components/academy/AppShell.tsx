import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BookOpen, FolderKanban, GraduationCap, Home, Library, PenSquare, Settings, Target, TrendingUp } from "lucide-react";
import { useAcademy } from "@/lib/academy";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Басты бет", icon: Home },
  { to: "/lessons", label: "Сабақтар", icon: BookOpen },
  { to: "/modules", label: "Модульдер", icon: FolderKanban },
  { to: "/practice", label: "Практика", icon: Target },
  { to: "/materials", label: "Материалдар", icon: Library },
  { to: "/progress", label: "Менің нәтижем", icon: TrendingUp },
  { to: "/settings", label: "Баптаулар", icon: Settings },
] as const;

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Бұл — тәуелсіз оқу жобасы. Kaspi.kz компаниясымен ресми байланысы жоқ және оның атынан әрекет етпейді.
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const s = useAcademy();
  const path = useRouterState({ select: (r) => r.location.pathname });
  useEffect(() => { document.documentElement.dataset["accent"] = s.settings.accent; }, [s.settings.accent]);
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-xl bg-hero text-primary-foreground shadow-[var(--shadow-soft)]"><GraduationCap className="size-5" /></div>
          <div className="min-w-0"><div className="truncate font-display text-lg font-semibold leading-tight">{s.settings.courseTitle}</div><div className="text-xs text-muted-foreground">Оқу порталы</div></div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active(n.to) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted")}>
              <n.icon className="size-[18px]" />{n.label}
            </Link>
          ))}
        </nav>
        <Link to="/admin" className={cn("mb-4 flex items-center gap-3 rounded-xl border border-gold/50 px-3 py-2.5 text-sm font-semibold transition-colors",
          active("/admin") ? "bg-primary text-primary-foreground" : "bg-gold-soft text-foreground hover:bg-gold-soft/70")}>
          <PenSquare className="size-[18px]" />Контентті басқару
        </Link>
        <Disclaimer className="px-2" />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-hero text-primary-foreground"><GraduationCap className="size-[18px]" /></div>
          <span className="truncate font-display text-base font-semibold">{s.settings.courseTitle}</span>
        </Link>
        <Link to="/admin" aria-label="Контентті басқару" className={cn("flex shrink-0 items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs font-semibold",
          active("/admin") ? "bg-primary text-primary-foreground" : "bg-gold-soft")}>
          <PenSquare className="size-3.5" />Басқару
        </Link>
      </header>

      <main className="pb-safe lg:pl-64 lg:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="flex overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex min-w-[76px] flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10.5px] font-medium",
              active(n.to) ? "text-primary" : "text-muted-foreground")}>
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active(n.to) && "bg-primary-soft")}><n.icon className="size-[18px]" /></span>
              <span className="whitespace-nowrap">{n.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
