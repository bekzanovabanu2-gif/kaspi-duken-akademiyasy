import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Eye, FileText, FolderKanban, ListChecks, Megaphone, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConfirmDelete, EmptyState, PageHeader, SampleBadge } from "./ui";
import { ContentPreview } from "./ContentPreview";
import { EntityFields, Field } from "./EntityFields";
import { setState, useAcademy, type AcademyState } from "@/lib/academy";
import { clearLegacy, hydrateFromCloud, legacyContent, pushContent, useAdmin } from "@/lib/cloud-content";
import { emptyContent, mergeLegacyContent } from "@/lib/content-transfer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { CloudUpload, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { deleteEntity, newDraft, reorderEntity, saveDraft, STORAGE_FAILURE, validateDraft, type Draft, type EntityKind } from "@/lib/academy-editor";

const sections = [
  { kind: "modules", label: "Модульдер", singular: "Модуль", icon: FolderKanban },
  { kind: "lessons", label: "Сабақтар", singular: "Сабақ", icon: BookOpen },
  { kind: "materials", label: "Материалдар", singular: "Материал", icon: FileText },
  { kind: "quizzes", label: "Тесттер", singular: "Тест", icon: ListChecks },
  { kind: "announcements", label: "Хабарландырулар", singular: "Хабарландыру", icon: Megaphone },
] as const;

function publish(draft: Draft, published: boolean): Draft {
  // Updating the common publication field preserves each discriminated entity's shape.
  return { ...draft, value: { ...draft.value, published } } as Draft;
}

export function ContentEditor() {
  const auth = useAdmin();
  if (auth.loading) return <p className="py-16 text-center text-sm text-muted-foreground">Тексерілуде…</p>;
  if (!auth.admin) return <div className="mx-auto max-w-md py-10"><EmptyState icon={ShieldCheck} title={auth.email ? "Әкімші рұқсаты жоқ" : "Әкімші ретінде кіріңіз"}
    text={auth.email ? `${auth.email} аккаунтында контентті басқару рұқсаты жоқ.` : "Сабақтар мен бейнелерді тек әкімші қоса алады."}
    action={auth.email ? <Button variant="outline" onClick={() => void supabase.auth.signOut()}><LogOut />Шығу</Button> : <Button asChild><Link to="/auth"><LogIn />Кіру</Link></Button>} /></div>;
  return <AdminEditor email={auth.email} />;
}

function AdminEditor({ email }: { email: string | null }) {
  const state = useAcademy();
  const [legacy, setLegacy] = useState(() => legacyContent());
  const migrate = async () => {
    const next = mergeLegacyContent(state, legacy);
    const err = await pushContent(next);
    if (err) { toast.error("Көшіру сәтсіз: " + err); return; }
    clearLegacy(); setLegacy(emptyContent()); await hydrateFromCloud();
    toast.success("Браузердегі сабақтар бұлтқа көшірілді");
  };
  const [kind, setKind] = useState<EntityKind>("modules");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseline, setBaseline] = useState("");
  const [preview, setPreview] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = draft !== null && JSON.stringify(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const open = (item: Draft, asPreview = false) => {
    const copy = structuredClone(item);
    setDraft(copy); setBaseline(JSON.stringify(copy)); setPreview(asPreview); setError(null);
  };
  const close = () => {
    if (busy) return;
    if (dirty) setDiscard(true); else setDraft(null);
  };
  const validate = (item: Draft) => {
    const problem = validateDraft(item, state);
    setError(problem);
    if (problem) toast.error(problem);
    return !problem;
  };
  const persist = (updater: Parameters<typeof setState>[0], message: string) => {
    let next: AcademyState | null = null;
    try {
      if (!setState((s) => { next = updater(s); return next; })) { toast.error(STORAGE_FAILURE); return false; }
    } catch { toast.error(STORAGE_FAILURE); return false; }
    const n = next as AcademyState | null;
    if (n && (n.modules !== state.modules || n.lessons !== state.lessons)) {
      const id = toast.loading("Бұлтқа сақталуда…");
      void pushContent(n).then((err) => {
        if (err) toast.error("Бұлтқа сақталмады — оқушылар әзірге көрмейді. Қайта сақтап көріңіз.", { id });
        else toast.success(message + " · барлық оқушыларға қолжетімді", { id });
      });
    } else toast.success(message);
    return true;
  };
  const save = () => {
    if (!draft || busy || !validate(draft)) return;
    if (draft.value.published && !preview) { setPreview(true); return; }
    if (persist((s) => saveDraft(s, draft), draft.value.published ? "Жарияланды және сақталды" : "Жоба сақталды")) setDraft(null);
    else setError(STORAGE_FAILURE);
  };
  const details = sections.find((s) => s.kind === draft?.kind);

  return <div className="min-w-0">
    <PageHeader title="Контентті басқару" subtitle="Модульдер, сабақтар, материалдар, тесттер және хабарландырулар." />
    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-success" />Әкімші: {email}<Button variant="ghost" size="sm" onClick={() => void supabase.auth.signOut()}><LogOut />Шығу</Button></div>
    <p className="mb-5 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">Модульдер мен сабақтар (бейнелерімен) бұлтта сақталады және барлық оқушыларға көрінеді. Материалдар, тесттер мен хабарландырулар әзірге осы браузерде ғана сақталады.</p>
    {(legacy.modules.length > 0 || legacy.lessons.length > 0) && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-gold/50 bg-gold-soft p-3 text-sm"><span className="flex-1">Бұл браузерде бұрын қосылған {legacy.modules.length} модуль және {legacy.lessons.length} сабақ бар.</span><Button size="sm" onClick={() => void migrate()}><CloudUpload />Бұлтқа көшіру</Button></div>}
    <Tabs value={kind} onValueChange={(value) => { const section = sections.find((s) => s.kind === value); if (section) setKind(section.kind); }}>
      <div className="mb-6 overflow-x-auto border-b pb-3"><TabsList className="h-auto w-max justify-start gap-1 bg-muted p-1">{sections.map((s) => <TabsTrigger key={s.kind} value={s.kind} className="gap-2 px-3 py-2"><s.icon className="size-4" />{s.label}<span className="text-xs text-muted-foreground">{state[s.kind].length}</span></TabsTrigger>)}</TabsList></div>
      {sections.map((s) => {
        const list = state[s.kind];
        return <TabsContent key={s.kind} value={s.kind}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{s.label}</h2><Button onClick={() => open(newDraft(s.kind))}><Plus />{s.singular} қосу</Button></div>
          {list.length === 0 ? <EmptyState icon={s.icon} title={`${s.singular} әлі жоқ`} text="Жарияланған контент оқушыларға көрінеді." action={<Button variant="outline" onClick={() => open(newDraft(s.kind))}><Plus />{s.singular} қосу</Button>} /> : <div className="space-y-3">
            {list.map((value, i) => {
              // The array and entity kind originate from the same section.
              const item = { kind: s.kind, value } as Draft;
              return <article key={value.id} className="card-surface flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{i + 1}</span>{"sample" in value && value.sample && <SampleBadge />}<span className={value.published === false ? "text-xs text-muted-foreground" : "text-xs font-medium text-success"}>{value.published === false ? "Жоба" : "Жарияланған"}</span></div>
                  <h3 className="break-words font-sans font-semibold">{value.title}</h3>
                  <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{"description" in value ? value.description : value.body}</p>
                  {s.kind === "modules" && <p className="mt-1 text-xs text-muted-foreground">{state.lessons.filter((l) => l.moduleId === value.id).length} сабақ</p>}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1">
                  {(s.kind === "modules" || s.kind === "lessons") && <><Button variant="ghost" size="icon" disabled={i === 0} title="Жоғары жылжыту" aria-label={`${value.title}: жоғары`} onClick={() => persist((st) => reorderEntity(st, s.kind, value.id, -1), "Реті сақталды")}><ArrowUp /></Button><Button variant="ghost" size="icon" disabled={i === list.length - 1} title="Төмен жылжыту" aria-label={`${value.title}: төмен`} onClick={() => persist((st) => reorderEntity(st, s.kind, value.id, 1), "Реті сақталды")}><ArrowDown /></Button><span className="mx-1 h-5 w-px bg-border" /></>}
                  <Switch checked={value.published !== false} aria-label={`${value.title}: жариялау`} title="Жариялау" onCheckedChange={(checked) => {
                    if (checked) { if (validate(item)) open(publish(item, true), true); else open(item); }
                    else persist((st) => saveDraft(st, publish(item, false)), "Жариялаудан алынды");
                  }} />
                  <Button variant="ghost" size="icon" title="Алдын ала қарау" aria-label={`${value.title}: алдын ала қарау`} onClick={() => { if (validate(item)) open(item, true); else open(item); }}><Eye /></Button>
                  <Button variant="ghost" size="icon" title="Өңдеу" aria-label={`${value.title}: өңдеу`} onClick={() => open(item)}><Pencil /></Button>
                  <ConfirmDelete title={s.kind === "modules" ? `${value.title} (сабақтар жойылмайды, модульсіз қалады)` : value.title} onConfirm={() => persist((st) => deleteEntity(st, s.kind, value.id), "Жойылды")}><Button variant="ghost" size="icon" title="Жою" aria-label={`${value.title}: жою`} className="text-destructive"><Trash2 /></Button></ConfirmDelete>
                </div>
              </article>;
            })}
          </div>}
        </TabsContent>;
      })}
    </Tabs>
    <Dialog open={draft !== null} onOpenChange={(isOpen) => { if (!isOpen) close(); }}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-lg p-0" onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left"><DialogTitle>{preview ? "Алдын ала қарау" : `${details?.singular ?? "Контент"} редакторы`}</DialogTitle><DialogDescription>{draft?.value.published ? "Жарияланған" : "Жоба"}{draft && "sample" in draft.value && draft.value.sample ? " · Үлгі" : ""}</DialogDescription></DialogHeader>
        {draft && <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            {error && <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {preview ? <ContentPreview draft={draft} state={state} /> : <fieldset className="min-w-0 space-y-5">
              <Field label="Атауы *"><Input required autoFocus value={draft.value.title} onChange={(e) => setDraft({ ...draft, value: { ...draft.value, title: e.target.value } } as Draft)} /></Field>
              <EntityFields draft={draft} state={state} onChange={(next) => { setDraft(next); setError(null); }} onBusy={setBusy} />
              <div className="flex items-center justify-between gap-3 border-t pt-4"><Label htmlFor="publish-content">Жариялау</Label><Switch id="publish-content" checked={draft.value.published !== false} onCheckedChange={(checked) => setDraft(publish(draft, checked))} /></div>
              {draft.kind === "lessons" && state.modules.some((m) => draft.kind === "lessons" && m.id === draft.value.moduleId && m.published === false) && <p className="text-sm text-muted-foreground">Бұл модуль жарияланбаған. Сабақ модуль жарияланғаннан кейін көрінеді.</p>}
            </fieldset>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-background px-5 py-4">
            <Button type="button" variant="ghost" disabled={busy} onClick={close}>Бас тарту</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => { if (preview) setPreview(false); else if (validate(draft)) setPreview(true); }}>{preview ? <Pencil /> : <Eye />}{preview ? "Өңдеу" : "Алдын ала қарау"}</Button>
            <Button type="submit" disabled={busy}><Save />{busy ? "Файл жүктелуде…" : draft.value.published ? "Жариялау және сақтау" : "Сақтау"}</Button>
          </div>
        </form>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={discard} onOpenChange={setDiscard}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Өзгерістерді сақтамай жабу керек пе?</AlertDialogTitle><AlertDialogDescription>Сақталмаған өзгерістер жойылады. Бұрын сақталған контент өзгермейді.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Өңдеуді жалғастыру</AlertDialogCancel><AlertDialogAction onClick={() => { setDraft(null); setDiscard(false); }}>Сақтамай жабу</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
