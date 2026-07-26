"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-forest-800">
            <Sparkles className="size-5 text-lime-500" strokeWidth={2.2} />
          </div>
          <span className="text-[17px] font-medium tracking-tight text-forest-800">
            Hallederiz
          </span>
        </div>

        <div className="rounded-[16px] border border-hair bg-surface p-8 shadow-sm">
          <h1 className="text-[22px] font-semibold text-text-strong">Giriş yap</h1>
          <p className="mt-1 text-[14px] text-text-muted">
            Hesabın yok mu?{" "}
            <Link href="/signup" className="font-medium text-forest-700 hover:underline">
              Kayıt ol
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-strong">
                İş e-postası
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siz@sirket.com"
                className="w-full rounded-[10px] border border-hair bg-paper px-3.5 py-2.5 text-[14px] text-text-strong outline-none placeholder:text-text-faint focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-strong">
                Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[10px] border border-hair bg-paper px-3.5 py-2.5 text-[14px] text-text-strong outline-none placeholder:text-text-faint focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
              />
            </div>

            {error && (
              <p className="rounded-[8px] bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-[10px] bg-forest-800 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700 disabled:opacity-60"
            >
              {loading ? "Giriş yapılıyor…" : "Giriş yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
