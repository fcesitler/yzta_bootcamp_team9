"use client";

import { Sparkles, ChevronDown } from "lucide-react";
import { saveOnboarding } from "./actions";

const sectors = [
  "SaaS / Yazılım",
  "Fintech",
  "E-ticaret",
  "Sağlık / Healthtech",
  "Eğitim / Edtech",
  "Ajans / Danışmanlık",
  "Medya / İçerik",
  "Lojistik / Tedarik",
  "Üretim / Sanayi",
  "Diğer",
];

const inputCls =
  "w-full rounded-xl border border-hair bg-paper px-4 py-3 text-[14px] text-text-strong outline-none placeholder:text-text-faint transition-colors focus:border-forest-500 focus:ring-2 focus:ring-forest-100";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-[14px] bg-forest-800 shadow-md">
            <Sparkles className="size-6 text-lime-400" strokeWidth={2} />
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-forest-800">
            Hallederiz
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-hair bg-white px-8 py-8 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.10)]">
          <h1 className="text-[22px] font-semibold leading-snug text-text-strong">
            Hoş geldin 👋
          </h1>
          <p className="mt-1.5 text-[14px] leading-relaxed text-text-muted">
            Sana daha iyi lead bulabilmemiz için birkaç bilgiye ihtiyacımız var.
          </p>

          <form action={saveOnboarding} className="mt-7 flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-strong">
                Şirket adı
              </label>
              <input
                name="company"
                type="text"
                required
                placeholder="Örn. Acme Yazılım"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-strong">
                Unvanın
              </label>
              <input
                name="role"
                type="text"
                required
                placeholder="Örn. CEO, Head of Sales"
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-text-strong">
                Sektör
              </label>
              <div className="relative">
                <select
                  name="sector"
                  required
                  defaultValue=""
                  className={`${inputCls} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Seç…
                  </option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  strokeWidth={2}
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-forest-800 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-forest-700 active:scale-[0.99]"
            >
              Devam et →
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-text-faint">
          Bu bilgiler yalnızca AI araştırmasını kişiselleştirmek için kullanılır.
        </p>
      </div>
    </div>
  );
}
