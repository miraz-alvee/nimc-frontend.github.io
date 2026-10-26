"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDownUp, Bot, LayoutPanelLeft, Shapes, TrendingUp } from "lucide-react";

import { DealsSheet } from "./deals/deals-sheet";
import { TrendsSheet } from "./trends/trends-sheet";
import { AutoBotSheet } from "./auto-bot/auto-bot-sheet";
import { AssetsSheet } from "./assets/assets-sheet";
import { LayoutSheet } from "./layout/layout-sheet";
import { Panel } from "@/components/shared/panel";
import { NavItem } from "@/components/shared/nav-item";

import profileImage from "@/public/images/profile-image.png";

const top = [
  { key: "deals", label: "Deals", icon: ArrowDownUp, Sheet: DealsSheet },
  { key: "trends", label: "Trends", icon: TrendingUp, Sheet: TrendsSheet },
  { key: "auto-bot", label: "Auto Bot", icon: Bot, Sheet: AutoBotSheet },
];
const bottom = [
  { key: "assets", label: "Assets", icon: Shapes, Sheet: AssetsSheet },
  { key: "layout", label: "Layout", icon: LayoutPanelLeft, Sheet: LayoutSheet },
];

export function RightSidebar() {
  const [active, setActive] = useState<string | null>(null);
  const toggle = (key: string) => setActive((cur) => (cur === key ? null : key));

  return (
    <>
      <Panel className="absolute right-5 top-5 bottom-5 z-50 flex w-20 flex-col overflow-hidden">
        <div className="flex h-21 items-center justify-center border-b border-cyan-400/30">
          <Image src={profileImage} alt="Profile" width={60} height={60} className="size-15 rounded-full object-cover" />
        </div>

        {top.map(({ key, label, icon }) => (
          <NavItem key={key} icon={icon} label={label} active={active === key} onClick={() => toggle(key)} />
        ))}

        <div className="flex-1" />

        {bottom.map(({ key, label, icon }) => (
          <NavItem key={key} icon={icon} label={label} active={active === key} onClick={() => toggle(key)} />
        ))}
      </Panel>

      {[...top, ...bottom].map(({ key, Sheet }) => (
        <Sheet key={key} open={active === key} onOpenChange={(open: boolean) => setActive(open ? key : null)} />
      ))}
    </>
  );
}
