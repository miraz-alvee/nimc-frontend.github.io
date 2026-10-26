"use client";

import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";

export function LayoutSheet(props: SheetProps) {
  return (
    <SideSheet {...props} side="right" title="Layout">
      <div className="p-4 text-sm text-white/80">Layout content goes here</div>
    </SideSheet>
  );
}
