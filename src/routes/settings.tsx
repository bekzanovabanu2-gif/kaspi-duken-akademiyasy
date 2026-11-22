import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDelete, PageHeader } from "@/components/academy/ui";
import { Disclaimer } from "@/components/academy/AppShell";
import { resetState, setState, useAcademy, type Accent } from "@/lib/academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [
    { title: "Баптаулар — Kaspi Academy — Banu" },
    { name: "description", content: "Курс атауы, жетекші аты және түс тақырыбы баптаулары." },
    { property: "og:title", content: "Баптаулар — Kaspi Academy" },
    { property: "og:description", content: "Курс баптаулары." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SettingsPage,
});

const accents: { id: Accent; label: string }[] = [
  { id: "burgundy", label: "Бордо" }, { id: "plum", label: "Өрік-күлгін" }, { id: "rose", label: "Раушан" }, { id: "emerald", label: "Изумруд" },
];

function SettingsPage() {
  const s = useAcademy();
  const [title, setTitle] = useState(s.settings.courseTitle);
  const [inst, setInst] = useState(s.settings.instructor);
  useEffect(() => { setTitle(s.settings.courseTitle); setInst(s.settings.instructor); }, [s.settings.courseTitle, s.settings.instructor]);
  const save = () => {
    if (!title.trim() || !inst.trim()) { toast.error("Барлық өрісті толтырыңыз"); return; }
    setState((st) => ({ ...st, settings: { ...st.settings, courseTitle: title.trim(), instructor: inst.trim() } })) ? toast.success("Сақталды") : toast.error("Сақтау мүмкін болмады");
  };
  return (
    <div className="max-w-2xl">
      <PageHeader title="Баптаулар" />
      <section className="card-surface space-y-4 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Жалпы</h2>
        <div className="space-y-1.5"><Label htmlFor="ct">Курс атауы</Label><Input id="ct" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="in">Жетекшінің аты</Label><Input id="in" value={inst} maxLength={40} onChange={(e) => setInst(e.target.value)} /></div>
        <Button onClick={save}>Сақтау</Button>
      </section>
      <section className="card-surface mt-5 p-5 md:p-6">
        <h2 className="mb-4 text-lg font-semibold">Түс тақырыбы</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {accents.map((a) => (
            <button key={a.id} data-accent={a.id} onClick={() => { setState((st) => ({ ...st, settings: { ...st.settings, accent: a.id } })); toast.success(`«${a.label}» тақырыбы қосылды`); }}
              className={cn("flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium", s.settings.accent === a.id && "border-primary ring-2 ring-primary/30")}>
              <span className="grid size-10 place-items-center rounded-full bg-hero text-primary-foreground">{s.settings.accent === a.id && <Check className="size-4" />}</span>{a.label}
            </button>
          ))}
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 md:p-6">
        <h2 className="text-lg font-semibold">Бастапқы күйге қайтару</h2>
        <p className="mt-1 text-sm text-muted-foreground">Барлық қосылған контент, прогресс және баптаулар өшіріліп, тек үлгі элементтер қалады.</p>
        <ConfirmDelete title="барлық контент пен прогресс" onConfirm={() => { resetState(); toast.success("Бастапқы күйге қайтарылды"); }}>
          <Button variant="destructive" className="mt-4"><RotateCcw />Демо контентті қалпына келтіру</Button>
        </ConfirmDelete>
      </section>
      <Disclaimer className="mt-6" />
    </div>
  );
}
