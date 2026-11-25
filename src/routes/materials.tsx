import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, ExternalLink, FileText, Library, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SampleBadge } from "@/components/academy/ui";
import { useAcademy } from "@/lib/academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [
    { title: "Материалдар — Kaspi Дүкен Академиясы" },
    { name: "description", content: "Пайдалы файлдар, шаблондар мен сілтемелер кітапханасы." },
    { property: "og:title", content: "Материалдар — Kaspi Академия" },
    { property: "og:description", content: "Файлдар мен сілтемелер кітапханасы." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Materials,
});

function Materials() {
  const s = useAcademy();
  const [q, setQ] = useState(""); const [cat, setCat] = useState("all");
  const published = s.materials.filter((m) => m.published !== false);
  const cats = [...new Set(published.map((m) => m.category).filter(Boolean))];
  const list = published.filter((m) => (cat === "all" || m.category === cat) && (m.title + m.description).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Материалдар" subtitle="Шаблондар, нұсқаулықтар және пайдалы сілтемелер." />
      {published.length === 0 ? <EmptyState icon={Library} title="Материал жоқ" text="Файлдар мен сілтемелерді «Контентті басқару» бөлімінде қосыңыз." action={<Button asChild><Link to="/admin">Материал қосу</Link></Button>} /> : (
        <>
          <div className="relative mb-4"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Материал іздеу..." className="h-11 rounded-xl bg-card pl-10" /></div>
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {["all", ...cats].map((c) => <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium", cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>{c === "all" ? "Барлығы" : c}</button>)}
          </div>
          {list.length === 0 ? <EmptyState icon={Search} title="Ештеңе табылмады" text="Басқа сөзбен іздеп көріңіз." /> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => {
                const href = m.fileData || m.url;
                return (
                  <div key={m.id} className="card-surface flex flex-col p-5">
                    <div className="mb-3 flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-gold-soft"><FileText className="size-5 text-primary" /></span>{m.sample && <SampleBadge />}</div>
                    <h3 className="font-sans font-semibold">{m.title}</h3>
                    {m.description && <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.description}</p>}
                    <div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{m.category}</span>
                      {href && <a href={href} target="_blank" rel="noreferrer" download={m.fileData ? m.fileName : undefined} className="flex items-center gap-1.5 text-sm font-semibold text-primary">{m.fileData ? <><Download className="size-4" />Жүктеу</> : <><ExternalLink className="size-4" />Ашу</>}</a>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
