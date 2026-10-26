"use client";

import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = {
  value: T;
  label: string;
};

type Props<T extends string = string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tabClassName?: string;
};

export function TabToggle<T extends string = string>({
  tabs,
  value,
  onChange,
  className,
  tabClassName,
}: Props<T>) {
  return (
    <div
      className={cn(
        "relative flex w-full border-b border-[#0092B8]/40 bg-[#053345] shrink-0 font-albert-sans",
        className
      )}
    >
      {tabs.map((t) => {
        const isActive = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "font-albert-sans relative flex flex-1 h-14 items-center justify-center text-xs sm:text-sm font-medium transition-colors cursor-pointer px-2 whitespace-nowrap",
              isActive ? "text-[#00D3F2]" : "text-white/60 hover:text-white",
              tabClassName
            )}
          >
            <span>{t.label}</span>
            {isActive && (
              <>
                {/* Cyan active indicator bar */}
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF] shadow-[0_0_12px_#00E5FF,0_0_20px_#00E5FF]" />
                {/* Soft neon glow radiating upwards and downwards */}
                <span className="absolute -bottom-1 left-0 right-0 h-4 bg-[#00E5FF]/20 blur-md pointer-events-none" />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
