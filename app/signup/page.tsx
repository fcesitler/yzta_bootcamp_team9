"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
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
          <h1 className="text-[22px] font-semibold text-text-strong">Hesap oluştur</h1>
          <p className="mt-1 text-[14px] text-text-muted">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-forest-700 hover:underline">
              Giriş yap
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-strong">
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Furkan Çeşitler"
                className="w-full rounded-[10px] border border-hair bg-paper px-3.5 py-2.5 text-[14px] text-text-strong outline-none placeholder:text-text-faint focus:border-forest-400 focus:ring-2 focus:ring-forest-100"
              />
            </div>

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
                placeholder="En az 8 karakter"
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
              {loading ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
