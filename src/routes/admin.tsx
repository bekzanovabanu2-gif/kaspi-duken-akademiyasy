import { createFileRoute } from "@tanstack/react-router";
import { PenSquare } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/academy/ui";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Контентті басқару — Kaspi Academy — Banu" },
    { name: "description", content: "Сабақтар, модульдер, материалдар мен тесттерді басқару." },
    { property: "og:title", content: "Контентті басқару — Kaspi Academy" },
    { property: "og:description", content: "Курс контентін басқару." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <div>
      <PageHeader title="Контентті басқару" subtitle="Модульдер, сабақтар, материалдар, тесттер және хабарландырулар." />
      <EmptyState icon={PenSquare} title="Редактор жақында" text="Контент редакторы әзірленуде." />
    </div>
  ),
});
