import { createFileRoute } from "@tanstack/react-router";
import { ContentEditor } from "@/components/academy/ContentEditor";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Контентті басқару — Kaspi Дүкен Академиясы" },
    { name: "description", content: "Сабақтар, модульдер, материалдар мен тесттерді басқару." },
    { property: "og:title", content: "Контентті басқару — Kaspi Академия" },
    { property: "og:description", content: "Курс контентін басқару." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContentEditor,
});
