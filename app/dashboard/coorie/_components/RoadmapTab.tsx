"use client";

import { useMemo } from "react";
import { NotionUiProvider } from "@/components/dashboard/notion/notionContent";
import RoadmapView from "@/components/dashboard/notion/RoadmapView";
import { ACCENT, ACCENT_SOFT } from "./shared";

export function RoadmapTab() {
  const ui = useMemo(
    () => ({ accent: ACCENT, accentSoft: ACCENT_SOFT, clientName: "Coorie" }),
    [],
  );
  return (
    <NotionUiProvider value={ui}>
      <RoadmapView endpoint="/api/coorie/roadmap" viewKey="pf.coorie.roadmapView" />
    </NotionUiProvider>
  );
}
