import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ListChecks, Target, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/academy/ui";
import { logActivity, scoreQuiz, setState, useAcademy, type Quiz } from "@/lib/academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice")({
  head: () => ({ meta: [
    { title: "Практика — Kaspi Academy — Banu" },
    { name: "description", content: "Біліміңізді тексеретін тесттер мен жаттығулар." },
    { property: "og:title", content: "Практика — Kaspi Academy" },
    { property: "og:description", content: "Тесттер мен жаттығулар." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Practice,
});

function Practice() {
  const s = useAcademy();
  const [active, setActive] = useState<string | null>(null);
  const quizzes = s.quizzes.filter((q) => q.published && q.questions.length);
  const quiz = quizzes.find((q) => q.id === active);
  if (quiz) return <QuizRunner quiz={quiz} onExit={() => setActive(null)} />;
  return (
    <div>
      <PageHeader title="Практика" subtitle="Тест тапсырып, біліміңізді тексеріңіз." />
      {quizzes.length === 0 ? (
        <EmptyState icon={Target} title="Тест әлі қосылмаған" text="Көп нұсқалы сұрақтар мен түсініктемелерді «Контентті басқару» бөлімінде құрастырыңыз." action={<Button asChild><Link to="/admin">Тест құру</Link></Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((q) => {
            const r = s.progress.quizzes[q.id];
            return (
              <div key={q.id} className="card-surface flex flex-col p-5">
                <div className="mb-3 grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><ListChecks className="size-5" /></div>
                <h3 className="font-sans text-lg font-semibold">{q.title}</h3>
                {q.description && <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>}
                <p className="mt-3 text-xs text-muted-foreground">{q.questions.length} сұрақ{r && <> · Соңғы нәтиже: <strong className="text-foreground">{r.score}/{r.total}</strong></>}</p>
                <Button className="mt-4 self-start" onClick={() => setActive(q.id)}>{r ? "Қайта тапсыру" : "Бастау"}</Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuizRunner({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = scoreQuiz(quiz, answers);
  const submit = () => {
    if (Object.keys(answers).length < quiz.questions.length) { toast.error("Барлық сұраққа жауап беріңіз"); return; }
    setSubmitted(true);
    setState((s) => logActivity({ ...s, progress: { ...s.progress, quizzes: { ...s.progress.quizzes, [quiz.id]: { score, total: quiz.questions.length, date: new Date().toISOString() } } } }, `«${quiz.title}» тесті: ${score}/${quiz.questions.length}`));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onExit} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Тесттер</button>
      <h1 className="text-3xl font-semibold">{quiz.title}</h1>
      {submitted && (
        <div className="mt-5 rounded-2xl bg-hero p-6 text-center text-primary-foreground">
          <p className="text-sm opacity-80">Сіздің нәтижеңіз</p>
          <p className="font-display text-5xl font-semibold text-gold">{score}/{quiz.questions.length}</p>
          <p className="mt-1 text-sm">{Math.round((score / quiz.questions.length) * 100)}%</p>
        </div>
      )}
      <ol className="mt-6 space-y-4">
        {quiz.questions.map((q, i) => (
          <li key={q.id} className="card-surface p-5">
            <p className="mb-3 font-semibold"><span className="text-primary">{i + 1}.</span> {q.text}</p>
            <div className="space-y-2">
              {q.options.map((o, oi) => {
                const chosen = answers[q.id] === oi; const correct = q.correct === oi;
                return (
                  <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                    className={cn("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      !submitted && (chosen ? "border-primary bg-primary-soft" : "hover:bg-muted"),
                      submitted && correct && "border-success bg-success-soft",
                      submitted && chosen && !correct && "border-destructive bg-destructive/10")}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold">{String.fromCharCode(65 + oi)}</span>
                    <span className="flex-1">{o}</span>
                    {submitted && correct && <CheckCircle2 className="size-4 text-success" />}
                    {submitted && chosen && !correct && <XCircle className="size-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && <p className="mt-3 rounded-xl bg-gold-soft p-3 text-sm"><strong>Түсініктеме:</strong> {q.explanation}</p>}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex gap-2">
        {submitted ? <><Button onClick={() => { setAnswers({}); setSubmitted(false); }}>Қайта тапсыру</Button><Button variant="outline" onClick={onExit}>Аяқтау</Button></>
          : <Button size="lg" onClick={submit}>Нәтижені көру</Button>}
      </div>
    </div>
  );
}
