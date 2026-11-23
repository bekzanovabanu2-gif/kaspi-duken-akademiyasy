import { useState } from "react";
import { CheckCircle2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LessonView } from "./LessonView";
import { RichText, SampleBadge } from "./ui";
import { scoreQuiz, type AcademyState, type Quiz } from "@/lib/academy";
import { type Draft } from "@/lib/academy-editor";

function QuizPreview({ quiz }: { quiz: Quiz }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  return <div className="space-y-5">
    <h2 className="text-2xl font-semibold break-words">{quiz.title}</h2><p className="text-muted-foreground">{quiz.description}</p>
    {quiz.questions.map((q, i) => <fieldset key={q.id} className="space-y-2 border-t pt-4"><legend className="break-words font-semibold">{i + 1}. {q.text}</legend>
      {q.options.map((o, oi) => <label key={oi} className="flex items-center gap-3 rounded-md border p-3 text-sm"><input type="radio" disabled={submitted} name={`preview-${q.id}`} checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} className="accent-primary" /><span className="min-w-0 flex-1 break-words">{o}</span>{submitted && oi === q.correct && <CheckCircle2 className="size-4 shrink-0 text-success" />}</label>)}
      {submitted && q.explanation && <p className="break-words text-sm text-muted-foreground">{q.explanation}</p>}
    </fieldset>)}
    {submitted ? <p className="font-semibold">Нәтиже: {scoreQuiz(quiz, answers)}/{quiz.questions.length}</p> : <Button type="button" disabled={quiz.questions.some((q) => answers[q.id] === undefined)} onClick={() => setSubmitted(true)}>Нәтижені көру</Button>}
  </div>;
}

export function ContentPreview({ draft, state }: { draft: Draft; state: AcademyState }) {
  if (draft.kind === "lessons") { const lesson = draft.value; return <LessonView lesson={lesson} moduleTitle={state.modules.find((m) => m.id === lesson.moduleId)?.title} />; }
  if (draft.kind === "quizzes") return <QuizPreview key={JSON.stringify(draft.value)} quiz={draft.value} />;
  return <article className="space-y-4 break-words">
    {"sample" in draft.value && draft.value.sample && <SampleBadge />}
    <h2 className="text-2xl font-semibold">{draft.value.title}</h2>
    {draft.kind === "announcements" ? <RichText source={draft.value.body} /> : <p className="whitespace-pre-wrap text-muted-foreground">{draft.value.description}</p>}
    {draft.kind === "materials" && <><p className="text-sm text-muted-foreground">{draft.value.category}</p><Button asChild variant="outline"><a href={draft.value.fileData || draft.value.url} target="_blank" rel="noreferrer" download={draft.value.fileData ? draft.value.fileName : undefined}>{draft.value.fileData ? <Download /> : <ExternalLink />}{draft.value.fileData ? "Жүктеу" : "Ашу"}</a></Button></>}
    {draft.kind === "modules" && <ul className="space-y-2 border-t pt-4">{state.lessons.filter((l) => l.moduleId === draft.value.id && l.published).map((l) => <li key={l.id} className="text-sm">{l.title} · {l.duration} мин</li>)}</ul>}
  </article>;
}
