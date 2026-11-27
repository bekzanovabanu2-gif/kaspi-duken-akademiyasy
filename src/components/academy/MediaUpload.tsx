import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { uploadMedia } from "@/lib/cloud-content";

export function MediaUpload({ label, folder, fileName, onUploaded, onRemove, onBusy }: {
  label: string; folder: "videos" | "files"; fileName?: string | undefined;
  onUploaded: (path: string, name: string) => void; onRemove?: (() => void) | undefined; onBusy: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const callbacks = useRef({ onUploaded, onBusy }); callbacks.current = { onUploaded, onBusy };
  const [busy, setBusy] = useState(false); const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const upload = async (file: File | undefined) => {
    if (!file || controller.current) return;
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setPercent(0); setError(null); callbacks.current.onBusy(true);
    try {
      const path = await uploadMedia(file, folder, setPercent, abort.signal);
      callbacks.current.onUploaded(path, file.name);
    } catch (e) { setError(e instanceof Error ? e.message : "Файл жүктелмеді. Қайта таңдаңыз."); }
    finally { controller.current = null; setBusy(false); callbacks.current.onBusy(false); }
  };
  return <div className="space-y-3 border-t pt-4">
    <h3 className="font-semibold">{label} · ең көбі 50 МБ</h3>
    <input ref={input} type="file" aria-label={label} className="hidden" accept={folder === "videos" ? ".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm" : undefined} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
    {fileName && <p className="break-all text-sm">{fileName}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {busy && <div className="space-y-2" aria-live="polite"><div className="flex justify-between text-sm"><span>Жүктелуде…</span><span>{percent}%</span></div><Progress value={percent} aria-label="Жүктеу барысы" /><Button type="button" variant="outline" size="sm" onClick={() => controller.current?.abort()}><X />Жүктеуді тоқтату</Button></div>}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload />{fileName ? "Файлды ауыстыру" : error ? "Қайта таңдау" : "Файл таңдау"}</Button>
      {fileName && onRemove && <Button type="button" variant="ghost" disabled={busy} onClick={onRemove}><X />Алып тастау</Button>}
    </div>
    {percent === 100 && !busy && !error && <p className="text-sm text-success">Файл жүктелді. Өзгерістерді сақтаңыз.</p>}
  </div>;
}