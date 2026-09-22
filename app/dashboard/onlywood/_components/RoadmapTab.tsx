"use client";

import { useMemo } from "react";
import { NotionUiProvider } from "@/components/dashboard/notion/notionContent";
import RoadmapView from "@/components/dashboard/notion/RoadmapView";
import { ACCENT, ACCENT_SOFT } from "../config";

export function RoadmapTab() {
  const ui = useMemo(
    () => ({ accent: ACCENT, accentSoft: ACCENT_SOFT, clientName: "Onlywood" }),
    [],
  );
  return (
    <NotionUiProvider value={ui}>
      <RoadmapView endpoint="/api/onlywood/roadmap" viewKey="pf.onlywood.roadmapView" />
    </NotionUiProvider>
  );
}
