import { Clock, Download, ExternalLink, PlayCircle } from "lucide-react";
import { RichText, SampleBadge } from "./ui";
import { toEmbedUrl, type Lesson } from "@/lib/academy";

export function LessonView({ lesson, moduleTitle }: { lesson: Lesson; moduleTitle?: string | undefined }) {
  const embed = lesson.videoUrl ? toEmbedUrl(lesson.videoUrl) : null;
  return (
    <article className="space-y-6">
      {lesson.cover && <img src={lesson.cover} alt="" className="aspect-[21/9] w-full rounded-2xl border object-cover" />}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {lesson.sample && <SampleBadge />}
          {moduleTitle && <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-semibold text-primary">{moduleTitle}</span>}
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{lesson.duration} мин</span>
          {lesson.category && <span>#{lesson.category}</span>}
        </div>
        <h1 className="text-3xl font-semibold md:text-4xl">{lesson.title || "Атауы жоқ сабақ"}</h1>
        {lesson.description && <p className="mt-2 text-muted-foreground">{lesson.description}</p>}
      </div>
      {lesson.videoUrl && (embed ? (
        <div className="aspect-video overflow-hidden rounded-2xl border bg-muted"><iframe src={embed} title={lesson.title} className="size-full" allowFullScreen allow="accelerometer; encrypted-media; picture-in-picture" /></div>
      ) : (
        <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="card-surface flex items-center gap-3 p-4 text-sm font-semibold text-primary"><PlayCircle className="size-6" />Бейнесабақты ашу<ExternalLink className="ml-auto size-4" /></a>
      ))}
      {lesson.content.trim() ? <div className="card-surface p-5 md:p-8"><RichText source={lesson.content} /></div> : <p className="text-sm italic text-muted-foreground">Мазмұн әлі қосылмаған.</p>}
      {lesson.resources.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl font-semibold">Ресурстар</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {lesson.resources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer" download={r.url.startsWith("data:") ? r.title : undefined} className="card-surface flex items-center gap-3 p-3.5 text-sm font-medium hover:text-primary">
                <span className="grid size-9 place-items-center rounded-lg bg-gold-soft"><Download className="size-4" /></span><span className="truncate">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
