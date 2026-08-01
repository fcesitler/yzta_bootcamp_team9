export type DbCampaign = {
  id: string;
  name: string;
  icp: Record<string, string> | null;
  signals: string[] | null;
  status: string;
  created_at: string;
};

// research JSONB shape written by the AI agent
export type LeadResearch = {
  industry?: string;
  size?: string;
  location?: string;
  website?: string | null;
  whyNow?: string;
  draftSubject?: string;
  replyClassification?: "interested" | "objection" | "not_now" | "irrelevant";
  replySummary?: string;
  suggestedReply?: string;
  meetingBrief?: string;
  meetingTime?: string;
  followUpCount?: number;
  followUpLastAt?: string;
};

export type DbLead = {
  id: string;
  campaign_id: string | null;
  company: string;
  initials: string | null;
  tint: string;
  contact: string | null;
  title: string | null;
  email: string | null;
  linkedin_url: string | null;
  score: number | null;
  stage: string;
  research: LeadResearch | null;
  draft_email: string | null;
  draft_linkedin: string | null;
  created_at: string;
};

export type DbMessage = {
  id: string;
  lead_id: string;
  direction: "out" | "in";
  channel: "email" | "linkedin";
  body: string;
  ai_suggested_reply: string | null;
  sent_at: string;
};

export type DbMeeting = {
  id: string;
  lead_id: string;
  scheduled_at: string;
  duration_min: number;
  platform: string | null;
  meet_url: string | null;
  brief: {
    keyPeople?: { name: string; role: string; note: string }[];
    talkingPoints?: string[];
    summary?: string;
  } | null;
};

export type DbAgentActivity = {
  id: string;
  campaign_id: string | null;
  lead_id: string | null;
  owner_id: string | null;
  step: string;
  status: string;
  summary: string;
  created_at: string;
};

export type DbContract = {
  id: string;
  lead_id: string;
  scope: string | null;
  amount: number | null;
  currency: string;
  billing: string | null;
  term: string | null;
  start_date: string | null;
  status: string;
};

export type DbContractTemplate = {
  owner_id: string;
  html: string;
  updated_at: string;
};
