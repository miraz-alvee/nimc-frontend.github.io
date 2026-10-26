"use client";

import { useState } from "react";
import { CircleHelp, LineChart, LogOut, Settings, User, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { AuthSheet } from "./auth/auth-sheet";
import { FinanceSheet } from "./finance/finance-sheet";
import { HelpSheet } from "./help/help-sheet";
import { SettingsSheet } from "./settings/settings-sheet";
import { Panel } from "@/components/shared/panel";
import { NavItem } from "@/components/shared/nav-item";
import { useAuth, useLogoutMutation, formatApiError } from "@/apis";

const top = [
  { key: "finance", label: "Finance", icon: Wallet, Sheet: FinanceSheet },
  { key: "help", label: "Help", icon: CircleHelp, Sheet: HelpSheet },
];

export function LeftSidebar() {
  const [active, setActive] = useState<string | null>(null);
  const toggle = (key: string) => setActive((cur) => (cur === key ? null : key));

  const { isAuthenticated } = useAuth();

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      if (active === "auth") setActive(null);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined);
  };

  return (
    <>
      <Panel className="absolute left-5 top-5 bottom-5 z-50 flex w-20 flex-col overflow-hidden ">
        <div className="flex h-21 items-center justify-center border-b border-cyan-400/30 text-2xl font-black leading-none text-white">
          LO<br />GO
        </div>

        <NavItem icon={LineChart} label="Trade" active={active === null} onClick={() => setActive(null)} />
        {top.map(({ key, label, icon }) => (
          <NavItem key={key} icon={icon} label={label} active={active === key} onClick={() => toggle(key)} />
        ))}

        <div className="flex-1" />

        <NavItem
          icon={Settings}
          label="Settings"
          active={active === "settings"}
          onClick={() => toggle("settings")}
        />

        {isAuthenticated ? (
          <NavItem
            icon={LogOut}
            label={logoutMutation.isPending ? "Exiting..." : "Logout"}
            danger
            onClick={handleLogout}
          />
        ) : (
          <NavItem
            icon={User}
            label="Login"
            active={active === "auth"}
            onClick={() => toggle("auth")}
          />
        )}
      </Panel>

      {top.map(({ key, Sheet }) => (
        <Sheet key={key} open={active === key} onOpenChange={(open: boolean) => setActive(open ? key : null)} />
      ))}
      <SettingsSheet open={active === "settings"} onOpenChange={(open: boolean) => setActive(open ? "settings" : null)} />
      {!isAuthenticated && (
        <AuthSheet open={active === "auth"} onOpenChange={(open: boolean) => setActive(open ? "auth" : null)} />
      )}
    </>
  );
}
