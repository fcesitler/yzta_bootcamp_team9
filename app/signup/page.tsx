"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AgentStage } from "@/components/login/agent-stage";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pw = useMemo(() => {
    const long = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-ZğıöşüçĞİÖŞÜÇ]/.test(password);
    const score = [long, hasNumber, hasLetter].filter(Boolean).length;
    return { long, hasNumber, hasLetter, score };
  }, [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!pw.long) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-[11px] border border-hair bg-paper py-3 pl-11 pr-3.5 text-[14px] text-text-strong outline-none transition-all placeholder:text-text-faint focus:border-forest-400 focus:bg-surface focus:ring-4 focus:ring-forest-100";

  const meter = (ok: boolean) =>
    cn(
      "h-1 flex-1 rounded-full transition-colors",
      ok ? "bg-lime-500" : "bg-surface-2"
    );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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
              Hesap oluştur
            </h1>
            <p className="mt-2 text-[14px] text-text-muted">
              Zaten hesabın var mı?{" "}
              <Link
                href="/login"
                className="font-medium text-forest-700 underline-offset-4 hover:underline"
              >
                Giriş yap
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-[13px] font-medium text-text-strong"
                >
                  Ad Soyad
                </label>
                <div className="relative">
                  <UserIcon
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint"
                    strokeWidth={1.9}
                  />
                  <input
                    id="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adın ve soyadın"
                    className={inputCls}
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 8 karakter"
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
                {password.length > 0 && (
                  <div className="mt-2.5">
                    <div className="flex gap-1">
                      <span className={meter(pw.score >= 1)} />
                      <span className={meter(pw.score >= 2)} />
                      <span className={meter(pw.score >= 3)} />
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
                      <li className={pw.long ? "text-forest-700" : ""}>
                        {pw.long ? "✓" : "·"} 8+ karakter
                      </li>
                      <li className={pw.hasLetter ? "text-forest-700" : ""}>
                        {pw.hasLetter ? "✓" : "·"} harf
                      </li>
                      <li className={pw.hasNumber ? "text-forest-700" : ""}>
                        {pw.hasNumber ? "✓" : "·"} rakam
                      </li>
                    </ul>
                  </div>
                )}
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
                {loading ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
              </button>

              <p className="mt-1 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-text-faint">
                <Check
                  className="mt-[3px] size-3 shrink-0 text-forest-700"
                  strokeWidth={2.6}
                />
                Kayıt ücretsiz — kredi kartı istemez.
              </p>
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
