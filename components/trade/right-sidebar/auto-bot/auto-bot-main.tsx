"use client";

import { Loader2, Play, Power, ShieldAlert, Sparkles } from "lucide-react";
import { RobotAvatar } from "./robot-avatar";
import { cn } from "@/lib/utils";
import type { AutoBot } from "@/apis";

type Props = {
  isActive: boolean;
  onToggleActive: () => void;
  onExecute?: () => void;
  isLoading?: boolean;
  isToggling?: boolean;
  isExecuting?: boolean;
  isAuthenticated?: boolean;
  bot?: AutoBot;
};

export function AutoBotMain({
  isActive,
  onToggleActive,
  onExecute,
  isLoading = false,
  isToggling = false,
  isExecuting = false,
  isAuthenticated = true,
  bot,
}: Props) {
  const formatDecidedTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-6 pb-6 px-6 bg-[#053345] font-albert-sans select-none overflow-y-auto">
      {/* Robot Avatar */}
      <div className="relative mb-6 flex items-center justify-center">
        <RobotAvatar className="size-32" isActive={isActive} />
      </div>

      {/* Power Button */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Cyan Glow when active */}
        {isActive && (
          <div className="absolute size-44 rounded-full bg-[#00E5FF]/20 blur-2xl pointer-events-none animate-pulse" />
        )}

        <button
          type="button"
          onClick={onToggleActive}
          disabled={isLoading || isToggling}
          aria-label={isActive ? "Deactivate Auto Bot" : "Activate Auto Bot"}
          className={cn(
            "relative size-28 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
            isActive
              ? "border-2 border-[#00E5FF] bg-[#022a38] text-[#00E5FF] shadow-[0_0_35px_rgba(0,229,255,0.7)]"
              : "border-2 border-[#0092B8]/50 bg-[#042838]/80 text-white/80 hover:border-[#0092B8] hover:text-white"
          )}
        >
          {isToggling ? (
            <Loader2 className="size-10 animate-spin text-[#00E5FF]" />
          ) : (
            <Power
              className={cn(
                "size-12 transition-all duration-300",
                isActive
                  ? "text-[#00E5FF] drop-shadow-[0_0_12px_#00E5FF]"
                  : "text-white"
              )}
              strokeWidth={2.2}
            />
          )}
        </button>
      </div>

      {/* Status Label */}
      <span
        className={cn(
          "mt-3 text-base font-medium tracking-wide transition-colors",
          isActive
            ? "text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"
            : "text-white/70"
        )}
      >
        {isToggling
          ? isActive
            ? "Deactivating..."
            : "Activating..."
          : isActive
          ? "Active"
          : "Inactive"}
      </span>

      {/* Manual Execution Action Button */}
      {onExecute && (
        <button
          type="button"
          onClick={onExecute}
          disabled={isExecuting || isLoading || !isAuthenticated}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00B8DB]/15 border border-[#00B8DB]/50 text-[#00E5FF] hover:bg-[#00B8DB]/25 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isExecuting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
          <span>{isExecuting ? "Executing Cycle..." : "Execute Cycle Now"}</span>
        </button>
      )}

      {/* Unauthenticated Alert */}
      {!isAuthenticated && (
        <div className="mt-6 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Sign In Required</p>
            <p className="text-white/70 mt-0.5">
              Please sign in from the left menu to activate automated trading and customize bot parameters.
            </p>
          </div>
        </div>
      )}

      {/* Runtime Telemetry Card */}
      {bot && (
        <div className="mt-5 w-full rounded-xl border border-[#005F78] bg-[#032331]/90 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#005F78]/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <Sparkles className="size-3 text-[#00E5FF]" /> Bot Telemetry
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase",
                isActive
                  ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40"
                  : "bg-white/10 text-white/60"
              )}
            >
              {bot.status || (isActive ? "RUNNING" : "STOPPED")}
            </span>
          </div>

          {(bot.symbol || bot.display_name) && (
            <div className="flex items-center justify-between text-white/70">
              <span>Market Symbol:</span>
              <span className="font-medium text-white">
                {bot.display_name || bot.symbol}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-white/70">
            <span>Strategy:</span>
            <span className="font-medium text-white capitalize">
              {bot.strategy_type === "moving_average"
                ? "Moving Average"
                : bot.strategy_type === "rsi"
                ? "RSI"
                : bot.strategy_type || "Standard"}
            </span>
          </div>

          <div className="flex items-center justify-between text-white/70">
            <span>Direction:</span>
            <span className="font-medium text-white capitalize">
              {bot.trade_direction === "buy_sell"
                ? "Buy & Sell"
                : bot.trade_direction === "buy"
                ? "Buy Only"
                : bot.trade_direction === "sell"
                ? "Sell Only"
                : bot.trade_direction || "All"}
            </span>
          </div>

          <div className="flex items-center justify-between text-white/70">
            <span>Timeframe:</span>
            <span className="font-medium text-[#00E5FF]">
              {bot.timeframe || "H1"}
            </span>
          </div>

          {bot.lot_size && (
            <div className="flex items-center justify-between text-white/70">
              <span>Lot Size:</span>
              <span className="font-medium text-white">{bot.lot_size}</span>
            </div>
          )}

          {bot.investment && (
            <div className="flex items-center justify-between text-white/70">
              <span>Investment:</span>
              <span className="font-medium text-white">${bot.investment}</span>
            </div>
          )}

          {bot.last_action && (
            <div className="pt-2 border-t border-[#005F78]/50 flex items-center justify-between text-white/70">
              <span>Last Action:</span>
              <span className="font-medium text-[#00E5FF] capitalize">
                {bot.last_action}
              </span>
            </div>
          )}

          {bot.last_reason && (
            <div className="text-[11px] text-white/60 bg-[#021c27] p-2 rounded border border-[#005F78]/40 italic leading-snug">
              &quot;{bot.last_reason}&quot;
            </div>
          )}

          {bot.last_decided_at && (
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
              <span>Last Evaluated:</span>
              <span>{formatDecidedTime(bot.last_decided_at)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
