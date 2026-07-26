"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase Realtime → server component'leri tazele.
// Pipeline koşarken (10 paralel lead) her insert'te refresh atmamak için
// değişiklikleri kısa bir pencerede toplayıp tek refresh çağırıyoruz.
const REFRESH_DEBOUNCE_MS = 1200;

export function RealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel("app-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_activity" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
