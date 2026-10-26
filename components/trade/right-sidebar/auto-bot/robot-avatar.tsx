"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  isActive?: boolean;
};

export function RobotAvatar({ className = "size-32", isActive = false }: Props) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center transition-all duration-500 select-none",
        isActive
          ? "drop-shadow-[0_0_20px_rgba(0,229,255,0.55)] -translate-y-1"
          : "drop-shadow-none opacity-85 translate-y-0",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full overflow-visible transition-colors duration-500"
        aria-hidden="true"
      >
        {/* 3 Radiating sparks above antenna */}
        <g
          className={cn(
            "transition-all duration-500",
            isActive
              ? "stroke-[#00E5FF] opacity-100 drop-shadow-[0_0_8px_#00E5FF] animate-pulse"
              : "stroke-white/40 opacity-30"
          )}
        >
          <line x1="50" y1="12" x2="50" y2="6" strokeWidth="2.8" />
          <line x1="42" y1="14" x2="37" y2="9" strokeWidth="2.8" />
          <line x1="58" y1="14" x2="63" y2="9" strokeWidth="2.8" />
        </g>

        {/* Antenna knob & stem */}
        <circle
          cx="50"
          cy="18"
          r="3"
          stroke="none"
          className={cn(
            "transition-all duration-500",
            isActive
              ? "fill-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]"
              : "fill-white/70"
          )}
        />
        <line
          x1="50"
          y1="21"
          x2="50"
          y2="28"
          strokeWidth="3.2"
          className={cn(
            "transition-colors duration-500",
            isActive ? "stroke-[#00E5FF]" : "stroke-white/80"
          )}
        />

        {/* Head */}
        <rect
          x="26"
          y="28"
          width="48"
          height="35"
          rx="11"
          strokeWidth="3.5"
          className={cn(
            "transition-colors duration-500",
            isActive ? "stroke-white" : "stroke-white/80"
          )}
        />

        {/* Eyes */}
        <g className="transition-all duration-500">
          <circle
            cx="40"
            cy="45"
            r="3.5"
            stroke="none"
            className={cn(
              "transition-all duration-500",
              isActive
                ? "fill-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]"
                : "fill-white/80"
            )}
          />
          <circle
            cx="60"
            cy="45"
            r="3.5"
            stroke="none"
            className={cn(
              "transition-all duration-500",
              isActive
                ? "fill-[#00E5FF] drop-shadow-[0_0_6px_#00E5FF]"
                : "fill-white/80"
            )}
          />
        </g>

        {/* Body / Bowl chin */}
        <path
          d="M24 69 C24 86 76 86 76 69 Z"
          strokeWidth="3.5"
          className={cn(
            "transition-colors duration-500",
            isActive ? "stroke-white" : "stroke-white/80"
          )}
        />

        {/* Active Heartbeat / Energy Line inside body when active */}
        {isActive && (
          <path
            d="M38 76 Q50 82 62 76"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-80 drop-shadow-[0_0_4px_#00E5FF] animate-pulse"
          />
        )}
      </svg>
    </div>
  );
}
