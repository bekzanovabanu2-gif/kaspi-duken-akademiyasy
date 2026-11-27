import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUrl } from "@/lib/cloud-content";

export function StoredMediaLink({ path, title }: { path: string; title: string }) {
  const { url, failed, retry } = useMediaUrl(path);
  if (failed) return <div className="text-sm text-destructive"><span role="alert">«{title}» файлы табылмады немесе қолжетімсіз.</span><Button type="button" variant="ghost" size="sm" onClick={retry}><RefreshCw />Қайталау</Button></div>;
  if (!url) return <span className="text-sm text-muted-foreground">Файл сілтемесі алынуда…</span>;
  return <Button asChild type="button" variant="outline" className="max-w-full"><a href={url} target="_blank" rel="noreferrer"><Download /><span className="truncate">{title}</span></a></Button>;
}