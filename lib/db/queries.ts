import { createClient } from "@/lib/supabase/server";
import type { DbCampaign, DbLead, DbMessage, DbMeeting, DbContract, DbAgentActivity } from "./types";

export async function getCampaigns(): Promise<DbCampaign[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCampaignsWithStats() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, created_at, icp, signals")
    .order("created_at", { ascending: false });

  if (!campaigns?.length) return [];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, campaign_id, score, stage");

  const leadsByCampaign = (leads ?? []).reduce<Record<string, typeof leads>>((acc, l) => {
    if (!l.campaign_id) return acc;
    if (!acc[l.campaign_id]) acc[l.campaign_id] = [];
    acc[l.campaign_id]!.push(l);
    return acc;
  }, {});

  return campaigns.map((c) => {
    const cl = leadsByCampaign[c.id] ?? [];
    const topScore = cl.length ? Math.max(...cl.map((l) => l.score ?? 0)) : null;
    return { ...c, leadCount: cl.length, topScore };
  });
}

// Oturumdaki kullanıcının sözleşme şablonunu döndürür (yoksa null → çağıran default kullanır).
export async function getContractTemplate(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("contract_templates")
    .select("html")
    .eq("owner_id", user.id)
    .maybeSingle();
  return data?.html ?? null;
}

export async function getLeads(campaignId?: string): Promise<DbLead[]> {
  const supabase = await createClient();
  let query = supabase.from("leads").select("*").order("score", { ascending: false });
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data } = await query;
  return data ?? [];
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const [campaigns, leads, messages, meetings, contracts] = await Promise.all([
    supabase.from("campaigns").select("id, name, status").order("created_at", { ascending: false }).limit(1),
    supabase.from("leads").select("id, stage, score"),
    supabase.from("messages").select("id, direction"),
    supabase.from("meetings").select("id"),
    supabase.from("contracts").select("id, amount, currency, status"),
  ]);

  const allLeads = leads.data ?? [];
  const allMessages = messages.data ?? [];
  const allMeetings = meetings.data ?? [];
  const allContracts = contracts.data ?? [];
  const activeCampaign = campaigns.data?.[0] ?? null;

  const sentMessages = allMessages.filter((m) => m.direction === "out").length;
  const replies = allMessages.filter((m) => m.direction === "in").length;
  const pendingApproval = allLeads.filter((l) => l.stage === "awaiting_approval").length;
  const wonContracts = allContracts.filter((c) => c.status === "signed");
  const wonRevenue = wonContracts.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const scoredLeads = allLeads.filter((l) => l.score != null);
  const avgScore = scoredLeads.length
    ? Math.round(scoredLeads.reduce((s, l) => s + (l.score ?? 0), 0) / scoredLeads.length)
    : null;

  const hasStage = (stages: string[]) => allLeads.filter((l) => stages.includes(l.stage)).length;

  return {
    activeCampaign,
    pipelineStages: [
      { n: "01", label: "Bulunan", value: allLeads.length, color: "bg-forest-200" },
      { n: "02", label: "Gönderildi", value: hasStage(["sent", "replied", "meeting_booked", "won"]), color: "bg-forest-400" },
      { n: "03", label: "Yanıtladı", value: hasStage(["replied", "meeting_booked", "won"]), color: "bg-forest-600" },
      { n: "04", label: "Toplantı+", value: hasStage(["meeting_booked", "won"]), color: "bg-forest-800" },
    ],
    metrics: [
      { label: "Bulunan Lead", value: String(allLeads.length), sub: "", tone: "default" as const },
      { label: "Ort. ICP Skoru", value: avgScore != null ? String(avgScore) : "—", sub: avgScore != null ? "0-100 arası" : "henüz skor yok", tone: avgScore != null && avgScore >= 80 ? ("positive" as const) : ("default" as const) },
      { label: "Onay Bekleyen", value: String(pendingApproval), sub: pendingApproval > 0 ? "senin sıran" : "", tone: pendingApproval > 0 ? ("warning" as const) : ("default" as const) },
      { label: "Gönderilen", value: String(sentMessages), sub: "", tone: "default" as const },
      { label: "Yanıtlar", value: String(replies), sub: sentMessages > 0 ? `%${Math.round((replies / sentMessages) * 100)} yanıt oranı` : "", tone: "default" as const },
      { label: "Toplantılar", value: String(allMeetings.length), sub: "", tone: "default" as const },
      { label: "Kazanılan", value: String(wonContracts.length), sub: wonRevenue > 0 ? `€${(wonRevenue / 1000).toFixed(1)}k MRR` : "", tone: wonContracts.length > 0 ? ("positive" as const) : ("default" as const) },
    ],
  };
}

export async function getAgentActivity(limit = 12): Promise<DbAgentActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DbAgentActivity[];
}

export async function getApprovalLeads() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, company, initials, tint, contact, score, research")
    .eq("stage", "awaiting_approval")
    .order("score", { ascending: false });
  return data ?? [];
}

export async function getLeadWithMessages(leadId: string) {
  const supabase = await createClient();
  const [lead, messages] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).single(),
    supabase.from("messages").select("*").eq("lead_id", leadId).order("sent_at"),
  ]);
  return { lead: lead.data as DbLead | null, messages: (messages.data ?? []) as DbMessage[] };
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, company, initials, tint, contact, title, stage, research")
    .order("created_at", { ascending: false });

  if (!leads?.length) return [];

  const leadIds = leads.map((l) => l.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .in("lead_id", leadIds)
    .order("sent_at", { ascending: true });

  return leads
    .map((lead) => ({
      lead: lead as typeof lead & { research: import("./types").LeadResearch | null },
      messages: (messages ?? []).filter((m) => m.lead_id === lead.id) as DbMessage[],
      latestAt:
        [...(messages ?? [])].reverse().find((m) => m.lead_id === lead.id)?.sent_at ?? lead.id,
    }))
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

export async function getLeadsWithBriefs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("stage", "meeting_booked")
    .order("created_at", { ascending: false });
  return (data ?? []) as DbLead[];
}

export async function getMeetings() {
  const supabase = await createClient();
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, leads(company, initials, tint, contact, title)")
    .order("scheduled_at");
  return (meetings ?? []) as (DbMeeting & { leads: { company: string; initials: string; tint: string; contact: string; title: string } | null })[];
}

export async function getContracts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*, leads(company, initials, tint, contact, title)")
    .order("created_at", { ascending: false });
  return (data ?? []) as (DbContract & { leads: { company: string; initials: string; tint: string; contact: string; title: string } | null })[];
}
