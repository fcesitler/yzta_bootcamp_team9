type Stage = { n: string; label: string; value: number };

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(startDeg));
  const sy = cy + r * Math.sin(rad(startDeg));
  const ex = cx + r * Math.cos(rad(endDeg));
  const ey = cy + r * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

export function ConversionDonut({ stages }: { stages: Stage[] }) {
  const found = stages[0]?.value ?? 0;
  const sent = stages[1]?.value ?? 0;
  const replied = stages[2]?.value ?? 0;
  const meetings = stages[3]?.value ?? 0;

  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

  // Gauge: 240° arc from 150° clockwise
  const cx = 64, cy = 65, r = 50;
  const START = 150, SPAN = 240;

  const bgPath = arcPath(cx, cy, r, START, START + SPAN);
  const fgEnd = START + Math.max(0, Math.min(replyRate / 100, 1)) * SPAN;
  const fgPath = replyRate > 0
    ? arcPath(cx, cy, r, START, Math.min(fgEnd, START + SPAN - 0.5))
    : null;

  const rows = [
    { label: "Bulunan", value: found },
    { label: "Gönderildi", value: sent },
    { label: "Yanıtladı", value: replied },
    { label: "Toplantı+", value: meetings },
  ];

  return (
    <div className="flex h-full flex-col rounded-card border border-hair bg-surface px-5 py-5 shadow-card">
      <h2 className="text-[15px] font-semibold text-text-strong">Dönüşüm</h2>

      {/* Gauge */}
      <div className="relative mx-auto mt-3" style={{ width: 128, height: 92 }}>
        <svg width="128" height="92" viewBox="0 0 128 92">
          <path
            d={bgPath}
            fill="none"
            stroke="var(--color-hair)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {fgPath && (
            <path
              d={fgPath}
              fill="none"
              stroke="var(--color-forest-800)"
              strokeWidth="10"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: 8 }}
        >
          <p className="text-[26px] font-bold leading-none tracking-tight text-text-strong">
            {replyRate}%
          </p>
          <p className="mt-1 text-[9px] uppercase tracking-wide text-text-faint">
            yanıt oranı
          </p>
        </div>
      </div>

      {/* Micro stats */}
      <div className="mt-4 space-y-2.5">
        {rows.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-[12px] text-text-muted">{s.label}</span>
            <span className="text-[13px] font-semibold tabular-nums text-text-strong">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
