import type { ReactNode } from "react";
import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { statusLabel, type LessonStatus } from "@/lib/academy";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary ring-1 ring-gold/40">
        <Icon className="size-6" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SampleBadge() {
  return <span className="rounded-full border border-gold/60 bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-foreground">Үлгі</span>;
}

export function StatusBadge({ status }: { status: LessonStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold",
      status === "done" && "bg-success-soft text-success",
      status === "in_progress" && "bg-gold-soft text-foreground",
      status === "not_started" && "bg-muted text-muted-foreground")}>
      {statusLabel[status]}
    </span>
  );
}

export function ConfirmDelete({ title, onConfirm, children }: { title: string; onConfirm: () => void; children: ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Жоюды растайсыз ба?</AlertDialogTitle>
          <AlertDialogDescription>«{title}» біржола жойылады. Бұл әрекетті қайтару мүмкін емес.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Бас тарту</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Жою</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("[")) {
      const lm = t.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const href = lm?.[2] ?? "";
      const safe = /^https?:\/\//.test(href) ? href : "#";
      out.push(<a key={`${key}-${i++}`} href={safe} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">{lm?.[1]}</a>);
    } else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Safe mini-markdown: ## heading, **bold**, *italic*, [link](url), - list, 1. list, ![alt](url) image. */
export function RichText({ source }: { source: string }) {
  const blocks = source.split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed text-foreground/90">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter(Boolean);
        if (!lines.length) return null;
        const k = `b${bi}`;
        if (lines.every((l) => /^[-•]\s/.test(l))) return <ul key={k} className="list-disc space-y-1 pl-6">{lines.map((l, i) => <li key={i}>{inline(l.replace(/^[-•]\s/, ""), `${k}${i}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\.\s/.test(l))) return <ol key={k} className="list-decimal space-y-1 pl-6">{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\.\s/, ""), `${k}${i}`)}</li>)}</ol>;
        return (
          <Fragment key={k}>
            {lines.map((l, i) => {
              const img = l.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
              if (img) return <img key={i} src={img[2]} alt={img[1]} className="w-full rounded-xl border" loading="lazy" />;
              if (l.startsWith("### ")) return <h4 key={i} className="text-lg font-semibold">{inline(l.slice(4), `${k}${i}`)}</h4>;
              if (l.startsWith("## ")) return <h3 key={i} className="text-2xl font-semibold">{inline(l.slice(3), `${k}${i}`)}</h3>;
              return <p key={i}>{inline(l, `${k}${i}`)}</p>;
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></div>
      <div><div className="text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>
    </div>
  );
}
