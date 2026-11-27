import { useRef, type ReactNode } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "./ui";
import { uid, type AcademyState } from "@/lib/academy";
import { MAX_FILE_BYTES, newQuestion, removeChoice, type Draft } from "@/lib/academy-editor";
import { MediaUpload } from "./MediaUpload";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}

function FormattedContent({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = "") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart; const end = el.selectionEnd;
    const selected = value.slice(start, end);
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); });
  };
  const tools = [
    { icon: Bold, label: "Қалың мәтін", before: "**", after: "**" },
    { icon: Italic, label: "Көлбеу мәтін", before: "*", after: "*" },
    { icon: Heading2, label: "Тақырып", before: "\n\n## ", after: "\n\n" },
    { icon: List, label: "Тізім", before: "\n\n- ", after: "\n\n" },
    { icon: Link2, label: "Сілтеме", before: "[", after: "](https://)" },
    { icon: ImagePlus, label: "Сурет", before: "\n\n![", after: "](https://)\n\n" },
  ];
  return <div className="min-w-0 space-y-2">
    <Label htmlFor="lesson-content">Сабақ мазмұны</Label>
    <div role="toolbar" aria-label="Мәтінді пішімдеу" className="flex flex-wrap gap-1 rounded-md border bg-muted p-1">
      {tools.map((t) => <Button key={t.label} type="button" variant="ghost" size="icon" title={t.label} aria-label={t.label} onClick={() => insert(t.before, t.after)}><t.icon /></Button>)}
    </div>
    <Textarea id="lesson-content" ref={ref} rows={10} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
  </div>;
}

export function EntityFields({ draft, state, onChange, onBusy }: { draft: Draft; state: AcademyState; onChange: (draft: Draft) => void; onBusy: (busy: boolean) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  if (draft.kind === "modules") {
    const v = draft.value; const update = (value: typeof v) => onChange({ kind: "modules", value });
    return <Field label="Сипаттама"><Textarea value={v.description} onChange={(e) => update({ ...v, description: e.target.value })} rows={4} /></Field>;
  }
  if (draft.kind === "lessons") {
    const v = draft.value; const update = (value: typeof v) => onChange({ kind: "lessons", value });
    return <div className="space-y-5">
      <Field label="Сипаттама"><Textarea value={v.description} onChange={(e) => update({ ...v, description: e.target.value })} rows={3} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="lesson-module">Модуль *</Label><Select value={v.moduleId ?? "none"} onValueChange={(id) => update({ ...v, moduleId: id === "none" ? null : id })}><SelectTrigger id="lesson-module"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Модульді таңдаңыз</SelectItem>{state.modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}{m.published === false ? " · Жоба" : ""}</SelectItem>)}</SelectContent></Select></div>
        <Field label="Санат"><Input value={v.category} onChange={(e) => update({ ...v, category: e.target.value })} /></Field>
        <Field label="Ұзақтығы (минут) *"><Input type="number" min={1} step={1} required value={Number.isNaN(v.duration) ? "" : v.duration} onChange={(e) => update({ ...v, duration: e.target.valueAsNumber })} /></Field>
      </div>
      <Field label="Мұқаба суретінің URL"><Input type="url" value={v.cover} onChange={(e) => update({ ...v, cover: e.target.value })} /></Field>
      <MediaUpload label="Сабақ бейнесі" folder="videos" fileName={v.videoName} onBusy={onBusy} onUploaded={(path, name) => update({ ...v, videoPath: path, videoName: name })} onRemove={() => { const { videoPath: _path, videoName: _name, ...rest } = v; update(rest); }} />
      <Field label="YouTube / Vimeo бейне URL"><Input type="url" value={v.videoUrl} onChange={(e) => update({ ...v, videoUrl: e.target.value })} /></Field>
      <FormattedContent value={v.content} onChange={(content) => update({ ...v, content })} />
      <section className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Ресурстар</h3><Button type="button" variant="outline" size="sm" onClick={() => update({ ...v, resources: [...v.resources, { id: uid(), title: "", url: "" }] })}><Plus />Қосу</Button></div>
        {v.resources.map((r, i) => <div key={r.id} className="grid gap-3 border-b pb-4 sm:grid-cols-[1fr_1fr_auto]">
          <Field label={`Ресурс ${i + 1}: атауы *`}><Input required value={r.title} onChange={(e) => update({ ...v, resources: v.resources.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x) })} /></Field>
          {r.path ? <p className="self-end break-all text-sm text-muted-foreground">Файл жүктелген</p> : <Field label={`Ресурс ${i + 1}: URL *`}><Input type="url" required value={r.url} onChange={(e) => update({ ...v, resources: v.resources.map((x) => x.id === r.id ? { ...x, url: e.target.value } : x) })} /></Field>}
          <ConfirmDelete title={r.title || `Ресурс ${i + 1}`} onConfirm={() => update({ ...v, resources: v.resources.filter((x) => x.id !== r.id) })}><Button type="button" size="icon" variant="ghost" className="self-end text-destructive" title="Ресурсты жою" aria-label={`Ресурс ${i + 1}: жою`}><Trash2 /></Button></ConfirmDelete>
        </div>)}
        <MediaUpload label="Қосымша файл" folder="files" onBusy={onBusy} onUploaded={(path, name) => update({ ...v, resources: [...v.resources, { id: uid(), title: name, path, url: "" }] })} />
      </section>
    </div>;
  }
  if (draft.kind === "materials") {
    const v = draft.value; const update = (value: typeof v) => onChange({ kind: "materials", value });
    const upload = async (file: File | undefined) => {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) { toast.error("Файл көлемі 1 МБ-тан аспауы керек."); return; }
      onBusy(true);
      try {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read"));
          reader.onerror = () => reject(new Error("read")); reader.onabort = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        update({ ...v, fileName: file.name, fileData: data });
        toast("Файл қосылды. Өзгерістерді сақтаңыз.");
      } catch { toast.error("Файл оқылмады. Қайта таңдап көріңіз."); }
      finally { onBusy(false); }
    };
    return <div className="space-y-4">
      <Field label="Сипаттама"><Textarea rows={3} value={v.description} onChange={(e) => update({ ...v, description: e.target.value })} /></Field>
      <Field label="Санат"><Input value={v.category} onChange={(e) => update({ ...v, category: e.target.value })} /></Field>
      <Field label="Материал URL"><Input type="url" value={v.url} onChange={(e) => update({ ...v, url: e.target.value })} /></Field>
      <MediaUpload label="Материал файлы" folder="files" fileName={v.fileName} onBusy={onBusy} onUploaded={(path, name) => { const { fileData: _data, ...rest } = v; update({ ...rest, filePath: path, fileName: name }); }} onRemove={() => { const { filePath: _path, fileData: _data, fileName: _name, ...rest } = v; update(rest); }} />
      <div className="space-y-3 border-t pt-4"><h3 className="font-semibold">Файл · ең көбі 1 МБ</h3>
        <input ref={fileInput} type="file" className="hidden" aria-label="Материал файлы" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
        {v.fileData ? <div className="flex items-center gap-3"><span className="min-w-0 flex-1 break-words text-sm">{v.fileName}</span><ConfirmDelete title={v.fileName ?? "Файл"} onConfirm={() => { const { fileData: _data, fileName: _name, ...rest } = v; update(rest); }}><Button type="button" variant="ghost" size="icon" title="Файлды алып тастау" aria-label="Файлды алып тастау"><X /></Button></ConfirmDelete></div> : null}
        <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}><Upload />{v.fileData ? "Файлды ауыстыру" : "Файл таңдау"}</Button>
      </div>
    </div>;
  }
  if (draft.kind === "quizzes") {
    const v = draft.value; const update = (value: typeof v) => onChange({ kind: "quizzes", value });
    return <div className="space-y-5">
      <Field label="Сипаттама"><Textarea rows={3} value={v.description} onChange={(e) => update({ ...v, description: e.target.value })} /></Field>
      <div className="flex items-center justify-between border-t pt-4"><h3 className="font-semibold">Сұрақтар · {v.questions.length}</h3><Button type="button" variant="outline" size="sm" onClick={() => update({ ...v, questions: [...v.questions, newQuestion()] })}><Plus />Сұрақ қосу</Button></div>
      {v.questions.map((q, i) => {
        const change = (value: typeof q) => update({ ...v, questions: v.questions.map((x) => x.id === q.id ? value : x) });
        return <section key={q.id} className="space-y-4 border-b pb-5">
          <div className="flex items-center justify-between"><h4 className="font-semibold">Сұрақ {i + 1}</h4><ConfirmDelete title={`Сұрақ ${i + 1}`} onConfirm={() => update({ ...v, questions: v.questions.filter((x) => x.id !== q.id) })}><Button type="button" size="icon" variant="ghost" title="Сұрақты жою" aria-label={`Сұрақ ${i + 1}: жою`} className="text-destructive"><Trash2 /></Button></ConfirmDelete></div>
          <Field label={`Сұрақ ${i + 1}: мәтіні *`}><Textarea required value={q.text} onChange={(e) => change({ ...q, text: e.target.value })} /></Field>
          <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Жауап нұсқалары · дұрыс жауап *</legend>
            {q.options.map((option, oi) => <div key={oi} className="flex min-w-0 items-center gap-2">
              <input type="radio" name={`correct-${q.id}`} aria-label={`Сұрақ ${i + 1}: дұрыс жауап ${oi + 1}`} checked={q.correct === oi} onChange={() => change({ ...q, correct: oi })} className="size-4 shrink-0 accent-primary" />
              <Input required aria-label={`Сұрақ ${i + 1}: жауап ${oi + 1}`} value={option} onChange={(e) => change({ ...q, options: q.options.map((o, n) => n === oi ? e.target.value : o) })} />
              <ConfirmDelete title={`Жауап ${oi + 1}`} onConfirm={() => change(removeChoice(q, oi))}><Button type="button" variant="ghost" size="icon" disabled={q.options.length <= 2} title="Жауапты жою" aria-label={`Сұрақ ${i + 1}: жауап ${oi + 1} жою`} className="shrink-0 text-destructive"><Trash2 /></Button></ConfirmDelete>
            </div>)}
          </fieldset>
          <Button type="button" variant="outline" size="sm" onClick={() => change({ ...q, options: [...q.options, ""] })}><Plus />Жауап қосу</Button>
          <Field label={`Сұрақ ${i + 1}: түсініктеме`}><Textarea value={q.explanation} onChange={(e) => change({ ...q, explanation: e.target.value })} /></Field>
        </section>;
      })}
    </div>;
  }
  const v = draft.value;
  return <Field label="Хабарландыру мәтіні *"><Textarea rows={8} required value={v.body} onChange={(e) => onChange({ kind: "announcements", value: { ...v, body: e.target.value } })} /></Field>;
}
