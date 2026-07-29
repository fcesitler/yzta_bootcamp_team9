/* Entegrasyon markaları.
   Gmail ve Supabase için gerçek marka yolları kullanıldı. Diğerleri ağırlıklı
   kelime-logo olduğu için, hatalı bir logo taklidi yerine marka renginde
   monogram karo tercih edildi. */

export function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 40" className={className} aria-hidden focusable="false">
      <path fill="#4285F4" d="M3.64 40h8.18V20.18L0 11.09v25.27C0 38.37 1.64 40 3.64 40Z" />
      <path fill="#34A853" d="M40.18 40h8.18c2.01 0 3.64-1.64 3.64-3.64V11.09l-11.82 9.09V40Z" />
      <path fill="#FBBC04" d="M40.18 3.64v16.55L52 11.09V5.45c0-5.05-5.77-7.94-9.82-4.91l-2 1.5Z" />
      <path fill="#EA4335" d="M11.82 20.18V3.64L26 14.27 40.18 3.64v16.55L26 30.82Z" />
      <path fill="#C5221F" d="M0 5.45v5.64l11.82 9.09V3.64l-2-1.5C5.77-2.48 0 .4 0 5.45Z" />
    </svg>
  );
}

export function SupabaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 109 113" className={className} aria-hidden focusable="false">
      <path
        fill="#3ECF8E"
        d="M63.71 110.28c-2.86 3.61-8.66 1.63-8.73-2.97l-1.01-67.25h45.22c8.19 0 12.76 9.46 7.67 15.87l-43.15 54.35Z"
      />
      <path
        fill="#3ECF8E"
        opacity=".55"
        d="M45.32 2.07c2.86-3.6 8.65-1.63 8.72 2.97l.44 67.25H9.83c-8.19 0-12.76-9.46-7.67-15.87L45.32 2.07Z"
      />
    </svg>
  );
}

/** Kelime-logolu markalar için marka renginde monogram karo. */
export function MonogramIcon({
  label,
  bg,
  fg = "#FFFFFF",
  className,
}: {
  label: string;
  bg: string;
  fg?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center rounded-[9px] text-[13px] font-bold leading-none ${className ?? ""}`}
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}
