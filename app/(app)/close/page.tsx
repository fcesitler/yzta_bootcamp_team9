import Link from "next/link";
import { getContracts, getContractTemplate } from "@/lib/db/queries";
import { CloseView } from "@/components/close/close-view";
import { ContractTemplateCard } from "@/components/close/contract-template-card";
import { DEFAULT_CONTRACT_TEMPLATE } from "@/lib/contracts/default-template";
import { Trophy } from "lucide-react";

export default async function ClosePage() {
  const [contracts, savedTemplate] = await Promise.all([
    getContracts(),
    getContractTemplate(),
  ]);

  const templateHtml = savedTemplate ?? DEFAULT_CONTRACT_TEMPLATE;
  const isCustom = savedTemplate !== null;

  if (contracts.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-[14px] bg-surface-2">
            <Trophy className="size-6 text-text-faint" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[20px] font-medium text-text-strong">Henüz kapanan anlaşma yok</h2>
          <p className="mt-2 max-w-sm text-[14px] text-text-muted">
            Bir lead&apos;i &quot;Kazanıldı&quot; olarak işaretlediğinde AI sözleşme şablonunu otomatik doldurur.
          </p>
          <Link
            href="/campaigns"
            className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-medium text-paper hover:bg-forest-700"
          >
            Kampanyalara git
          </Link>
        </div>

        {/* Sıfırıncı adım: anlaşma kapanmadan önce şablonu hazırla */}
        <ContractTemplateCard
          initialHtml={templateHtml}
          isCustom={isCustom}
          defaultOpen={!isCustom}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <ContractTemplateCard initialHtml={templateHtml} isCustom={isCustom} />
      <CloseView contracts={contracts} />
    </div>
  );
}
