import { Search, Plus } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center gap-4 border-b border-hair bg-paper px-8 py-4">
      {/* Arama */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          placeholder="Firma, kişi, konuşma ara…"
          className="h-10 w-full rounded-[10px] border border-hair bg-surface pl-9 pr-14 text-[14px] text-text-strong placeholder:text-text-faint focus:border-forest-400 focus:outline-none"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-hair bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-faint">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-positive" />
          <span className="text-[13px] font-medium text-positive">
            Pipeline çalışıyor
          </span>
        </div>
        <button className="flex items-center gap-2 rounded-[10px] bg-forest-800 px-4 py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-forest-700">
          <Plus className="size-4" strokeWidth={2.4} />
          Yeni kampanya
        </button>
      </div>
    </header>
  );
}
