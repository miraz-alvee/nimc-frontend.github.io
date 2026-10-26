"use client";

import { useState } from "react";
import { SheetProps, SideSheet } from "@/components/shared/side-sheet";
import { TabToggle } from "@/components/shared/tab-toggle";
import SupportTab from "./tab/support-tab";
import FaqTab from "./tab/faq-tab";
import FeedbackTab from "./tab/feedback-tab";

const TABS = [
  { value: "support", label: "Support" },
  { value: "faqs", label: "FAQS" },
  { value: "feedback", label: "Feedback" },
];

export function HelpSheet(props: SheetProps) {
  const [tab, setTab] = useState("support");

  return (
    <SideSheet {...props} side="left" title="Help & Support">
      <div className="flex flex-col h-full font-albert-sans select-none">
        {/* Tab Toggle Navigation */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <TabToggle tabs={TABS} value={tab} onChange={setTab} />
        </div>

        {/* Tab Content with scrollbar suppression */}
        <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {tab === "support" && <SupportTab onOpenFeedback={() => setTab("feedback")} />}
          {tab === "faqs" && <FaqTab />}
          {tab === "feedback" && <FeedbackTab onSuccessNavigate={() => setTab("support")} />}
        </div>
      </div>
    </SideSheet>
  );
}
