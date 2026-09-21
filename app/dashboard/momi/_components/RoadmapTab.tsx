"use client";

import { useMemo } from "react";
import { NotionUiProvider } from "@/components/dashboard/notion/notionContent";
import RoadmapView from "@/components/dashboard/notion/RoadmapView";
import { ACCENT, ACCENT_SOFT } from "../config";

export function RoadmapTab() {
  const ui = useMemo(
    () => ({ accent: ACCENT, accentSoft: ACCENT_SOFT, clientName: "MOMI" }),
    [],
  );
  return (
    <NotionUiProvider value={ui}>
      <RoadmapView endpoint="/api/momi/roadmap" viewKey="pf.momi.roadmapView" />
    </NotionUiProvider>
  );
}
