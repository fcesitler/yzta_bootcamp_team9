import Link from "next/link";
import { getLeadsWithBriefs } from "@/lib/db/queries";
import { BriefsView } from "@/components/briefs/briefs-view";
import { FileText } from "lucide-react";

export default async function BriefsPage() {
  const leads = await getLeadsWithBriefs();

  if (leads.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center py-32 text-center">
        <div className="flex size-14 items-center justify-center rounded-[14px] bg-surface-2">
          <FileText className="size-6 text-text-faint" strokeWidth={1.5} />
        </div>
        <h2 className="mt-4 text-[20px] font-medium text-text-strong">Henüz toplantı brief&apos;i yok</h2>
        <p className="mt-2 max-w-sm text-[14px] text-text-muted">
          Lead&apos;lerle konuşma sonrası toplantı ayarlandığında AI brief otomatik hazırlanır.
        </p>
        <Link
          href="/campaigns"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-medium text-paper hover:bg-forest-700"
        >
          Kampanyalara git
        </Link>
      </div>
    );
  }

  return <BriefsView leads={leads} />;
}
