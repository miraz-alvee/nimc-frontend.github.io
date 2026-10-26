"use client";

import { useState } from "react";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { TabToggle, type TabItem } from "@/components/shared/tab-toggle";
import { SignInTab } from "./tab/sign-in";
import { RegisterTab } from "./tab/register";

const AUTH_TABS: TabItem<"signin" | "register">[] = [
  { value: "signin", label: "Sign In" },
  { value: "register", label: "Register" },
];

export function AuthSheet(props: SheetProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");

  return (
    <SideSheet {...props} side="left" title="Authentication" showHeader={false}>
      {/* Top Tab Bar matching Image */}
      <TabToggle
        tabs={AUTH_TABS}
        value={activeTab}
        onChange={setActiveTab}
        tabClassName="text-[20px]"
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "signin" ? (
          <SignInTab
            onSwitchTab={setActiveTab}
            onSuccess={() => props.onOpenChange(false)}
          />
        ) : (
          <RegisterTab
            onSwitchTab={setActiveTab}
            onSuccess={() => props.onOpenChange(false)}
          />
        )}
      </div>
    </SideSheet>
  );
}
