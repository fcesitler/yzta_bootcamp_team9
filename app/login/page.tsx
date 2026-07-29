"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AgentStage } from "@/components/login/agent-stage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const inputCls =
    "w-full rounded-[11px] border border-hair bg-paper py-3 pl-11 pr-3.5 text-[14px] text-text-strong outline-none transition-all placeholder:text-text-faint focus:border-forest-400 focus:bg-surface focus:ring-4 focus:ring-forest-100";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form — animasyondan bağımsız, her zaman görünür */}
      <div className="flex flex-col bg-paper px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-forest-800">
              <Sparkles className="size-5 text-lime-500" strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-forest-800">
              Hallederiz
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-text-strong"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.2} />
            Ana sayfa
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[28px] font-medium leading-tight tracking-[-0.02em] text-text-strong">
              Tekrar hoş geldin
            </h1>
            <p className="mt-2 text-[14px] text-text-muted">
              Hesabın yok mu?{" "}
              <Link
                href="/signup"
                className="font-medium text-forest-700 underline-offset-4 hover:underline"
              >
                Kayıt ol
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[13px] font-medium text-text-strong"
                >
                  İş e-postası
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint"
                    strokeWidth={1.9}
                  />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="siz@sirket.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[13px] font-medium text-text-strong"
                >
                  Şifre
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint"
                    strokeWidth={1.9}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={1.9} />
                    ) : (
                      <Eye className="size-4" strokeWidth={1.9} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-[10px] bg-danger-bg px-3.5 py-2.5 text-[13px] text-danger"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-forest-800 text-[15px] font-medium text-paper shadow-[0_10px_26px_-10px_rgba(28,75,60,0.6)] transition-all hover:bg-forest-700 hover:shadow-[0_14px_32px_-10px_rgba(28,75,60,0.7)] active:translate-y-px disabled:opacity-60 disabled:hover:shadow-none"
              >
                {loading && (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />
                )}
                {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[12px] text-text-faint">
          © {new Date().getFullYear()} Hallederiz
        </p>
      </div>

      <AgentStage />
    </div>
  );
}
