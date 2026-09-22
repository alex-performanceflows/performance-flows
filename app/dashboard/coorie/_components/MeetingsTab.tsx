"use client";

import { useMemo } from "react";
import { NotionUiProvider } from "@/components/dashboard/notion/notionContent";
import MeetingsView from "@/components/dashboard/notion/MeetingsView";
import { ACCENT, ACCENT_SOFT } from "./shared";

export function MeetingsTab() {
  const ui = useMemo(
    () => ({ accent: ACCENT, accentSoft: ACCENT_SOFT, clientName: "Coorie" }),
    [],
  );
  return (
    <NotionUiProvider value={ui}>
      <MeetingsView endpoint="/api/coorie/meetings" />
    </NotionUiProvider>
  );
}
