import type React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Кіру — Kaspi Дүкен Академиясы" },
    { name: "description", content: "Әкімші ретінде кіру." },
    { property: "og:title", content: "Кіру — Kaspi Академия" },
    { property: "og:description", content: "Контентті басқару үшін кіріңіз." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) { toast.success("Поштаңызды тексеріп, тіркелуді растаңыз."); return; }
    void navigate({ to: "/admin" });
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google арқылы кіру сәтсіз");
    else if (!r.redirected) void navigate({ to: "/admin" });
  };
  return <div className="mx-auto max-w-sm space-y-5 py-10">
    <h1 className="text-2xl font-semibold">{mode === "in" ? "Кіру" : "Тіркелу"}</h1>
    <form onSubmit={submit} className="space-y-3">
      <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" required minLength={6} placeholder="Құпиясөз" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Кіру" : "Тіркелу"}</Button>
    </form>
    <Button variant="outline" className="w-full" onClick={() => void google()}>Google арқылы жалғастыру</Button>
    <button className="text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Аккаунт жоқ па? Тіркелу" : "Аккаунт бар ма? Кіру"}</button>
  </div>;
}
