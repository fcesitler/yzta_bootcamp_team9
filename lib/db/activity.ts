import { createAdminClient } from "@/lib/supabase/admin";

// agent_activity: AI agent'ların ve otomasyon adımlarının denetim kaydı.
// Dashboard'daki "agents active" feed'ini besler ve jüriye "agent'lar gerçekten
// çalışıyor" kanıtı sunar. Sadece server (action / route / Trigger.dev) tarafından
// yazılır — service-role ile RLS baypas edilir.

export type AgentStep =
  | "find"
  | "research"
  | "score"
  | "write"
  | "send"
  | "classify"
  | "meeting"
  | "contract";

export type AgentStatus = "started" | "completed" | "error";

type LogInput = {
  ownerId: string;
  step: AgentStep;
  status: AgentStatus;
  summary: string;
  leadId?: string | null;
  campaignId?: string | null;
};

// Aktivite kaydı ekler. Ana akışı bloklamamak için hata fırlatmaz — sadece loglar.
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("agent_activity").insert({
      owner_id: input.ownerId,
      lead_id: input.leadId ?? null,
      campaign_id: input.campaignId ?? null,
      step: input.step,
      status: input.status,
      summary: input.summary,
    });
  } catch (e) {
    console.error("logActivity failed:", e);
  }
}
