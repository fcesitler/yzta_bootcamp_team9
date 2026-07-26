import Link from "next/link";
import { getConversations } from "@/lib/db/queries";
import { ConversationsView } from "@/components/conversations/conversations-view";
import { MessageSquare } from "lucide-react";

export default async function ConversationsPage() {
  const conversations = await getConversations();

  if (conversations.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center py-32 text-center">
        <div className="flex size-14 items-center justify-center rounded-[14px] bg-surface-2">
          <MessageSquare className="size-6 text-text-faint" strokeWidth={1.5} />
        </div>
        <h2 className="mt-4 text-[20px] font-medium text-text-strong">Henüz konuşma yok</h2>
        <p className="mt-2 max-w-sm text-[14px] text-text-muted">
          Kampanya başlatıp lead&apos;ler onaylandıktan sonra gelen yanıtlar burada görünür.
        </p>
        <Link
          href="/campaign"
          className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-forest-800 px-5 py-2.5 text-[14px] font-medium text-paper hover:bg-forest-700"
        >
          Kampanya başlat
        </Link>
      </div>
    );
  }

  return <ConversationsView conversations={conversations} />;
}
