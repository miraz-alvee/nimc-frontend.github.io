"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  Play,
  Power,
  Radio,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { RobotAvatar } from "./robot-avatar";
import { cn } from "@/lib/utils";
import type { AutoBot, BotDecision } from "@/apis";

type Props = {
  isActive: boolean;
  onToggleActive: () => void;
  onExecute?: () => void;
  isLoading?: boolean;
  isToggling?: boolean;
  isExecuting?: boolean;
  isAuthenticated?: boolean;
  isWsConnected?: boolean;
  bot?: AutoBot | null;
  lastDecision?: BotDecision | null;
};

export function AutoBotMain({
  isActive,
  onToggleActive,
  onExecute,
  isLoading = false,
  isToggling = false,
  isExecuting = false,
  isAuthenticated = true,
  isWsConnected = false,
  bot,
  lastDecision,
}: Props) {
  const formatDecidedTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const currentAction =
    lastDecision?.action?.toLowerCase() || bot?.last_action?.toLowerCase();
  const currentReason = lastDecision?.reason || bot?.last_reason;
  const cycleSeconds = bot?.auto_close_seconds || 30;

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-4 pb-6 px-5 bg-[#053345] font-albert-sans select-none overflow-y-auto">
      {/* Real-time Status Banner */}
      {isActive && (
        <div className="mb-4 w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs">
          <div className="flex items-center gap-2 text-[#00E5FF] font-medium">
            <Radio className="size-3.5 animate-pulse text-[#00E5FF]" />
            <span>Auto-Trading Active</span>
          </div>
          <span className="text-[11px] text-white/70 flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isWsConnected ? "bg-[#00E676] animate-pulse" : "bg-amber-400"
              )}
            />
            {isWsConnected ? `Cycle: ~${cycleSeconds}s` : "Connecting..."}
          </span>
        </div>
      )}

      {/* Robot Avatar */}
      <div className="relative mb-5 flex items-center justify-center">
        <RobotAvatar className="size-28" isActive={isActive} />
      </div>

      {/* Power Button */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Cyan Glow when active */}
        {isActive && (
          <div className="absolute size-40 rounded-full bg-[#00E5FF]/20 blur-2xl pointer-events-none animate-pulse" />
        )}

        <button
          type="button"
          onClick={onToggleActive}
          disabled={isLoading || isToggling || isExecuting}
          aria-label={isActive ? "Deactivate Auto Bot" : "Activate Auto Bot"}
          className={cn(
            "relative size-26 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed",
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
                "size-11 transition-all duration-300",
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
      <div className="mt-3 flex flex-col items-center">
        <span
          className={cn(
            "text-base font-semibold tracking-wide transition-colors",
            isActive
              ? "text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]"
              : "text-white/70"
          )}
        >
          {isToggling
            ? isActive
              ? "Deactivating Auto-Trading..."
              : "Activating Auto-Trading..."
            : isActive
            ? "Auto-Trading Active"
            : "Inactive"}
        </span>
        <span className="text-[11px] text-white/50 mt-0.5">
          {isActive
            ? "Automated orders execute over WebSocket"
            : "Click power to start automatic trading"}
        </span>
      </div>

      {/* Manual Execution Action Button */}
      {onExecute && (
        <button
          type="button"
          onClick={onExecute}
          disabled={isExecuting || isLoading || isToggling || !isAuthenticated}
          className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00B8DB]/15 border border-[#00B8DB]/50 text-[#00E5FF] hover:bg-[#00B8DB]/25 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="mt-5 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Sign In Required</p>
            <p className="text-white/70 mt-0.5">
              Please sign in to activate automatic trading and customize bot parameters.
            </p>
          </div>
        </div>
      )}

      {/* Live Decision Card */}
      {isActive && (currentAction || currentReason) && (
        <div className="mt-4 w-full rounded-xl border border-[#0092B8]/40 bg-[#022230] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/60 flex items-center gap-1">
              <Activity className="size-3 text-[#00E5FF]" /> Live Decision
            </span>
            {currentAction && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  currentAction === "buy"
                    ? "bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40"
                    : currentAction === "sell"
                    ? "bg-[#FF2E4D]/20 text-[#FF2E4D] border border-[#FF2E4D]/40"
                    : "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                )}
              >
                {currentAction === "buy" && <ArrowUpRight className="size-3" />}
                {currentAction === "sell" && <ArrowDownRight className="size-3" />}
                {currentAction === "hold" && <Minus className="size-3" />}
                {currentAction}
              </span>
            )}
          </div>

          {currentReason && (
            <p className="text-[11px] text-white/80 italic bg-[#031822] p-2 rounded border border-[#005F78]/40 leading-relaxed">
              &quot;{currentReason}&quot;
            </p>
          )}
        </div>
      )}

      {/* Runtime Telemetry Card */}
      {bot && (
        <div className="mt-4 w-full rounded-xl border border-[#005F78] bg-[#032331]/90 p-4 space-y-2.5 text-xs">
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
            <span>Trade Direction:</span>
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

          {bot.auto_close_seconds && (
            <div className="flex items-center justify-between text-white/70">
              <span>Cycle Interval:</span>
              <span className="font-medium text-[#00E5FF]">
                {bot.auto_close_seconds}s
              </span>
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

          {bot.last_reason && !isActive && (
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
