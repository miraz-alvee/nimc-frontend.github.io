"use client";

import { Plus, Minus, ZoomIn, ZoomOut, TrendingUp, BarChart2, Loader2 } from "lucide-react";
import { useTrading } from "../trading-context";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const formatTime = (s: number) =>
  `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

export function BottomTradeBar() {
  const {
    investment,
    setInvestment,
    seconds,
    setSeconds,
    zoom,
    setZoom,
    chartType,
    toggleChartType,
    executeTrade,
    isPlacingTrade,
  } = useTrading();

  return (
    <div className="fixed bottom-10 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2.5 font-albert-sans select-none">
      {/* Row 1: Chart & Zoom controls */}
      <div className="flex items-center gap-2">
        {/* Chart type toggle button (Area vs Candlesticks) */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#0092B8] bg-[#053345]/80 backdrop-blur shadow-sm">
          <button
            type="button"
            aria-label={`Current: ${chartType} chart. Click to switch.`}
            title={chartType === "area" ? "Switch to Candlesticks" : "Switch to Area Chart"}
            onClick={toggleChartType}
            className="flex size-7 items-center justify-center rounded-md border border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/25 transition-colors cursor-pointer"
          >
            {chartType === "area" ? (
              <TrendingUp className="size-4" strokeWidth={2.2} />
            ) : (
              <BarChart2 className="size-4" strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex h-10 items-center rounded-xl border border-[#0092B8] bg-[#053345]/80 backdrop-blur text-white overflow-hidden shadow-sm">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(400, z + 25))}
            disabled={zoom >= 400}
            className="flex size-10 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomIn className="size-4.5 text-white/90" />
          </button>

          <div className="flex h-full items-center justify-center border-x border-[#0092B8]/60 px-4 text-sm font-medium text-white min-w-16">
            {zoom}%
          </div>

          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
            disabled={zoom <= 25}
            className="flex size-10 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomOut className="size-4.5 text-white/90" />
          </button>
        </div>
      </div>

      {/* Row 2: Investment | SELL / BUY | Auto Close */}
      <div className="flex items-stretch gap-2.5">
        {/* Left: Investment Box */}
        <div className="flex h-19 w-52 overflow-hidden rounded-2xl border border-[#0092B8] bg-[#053345]/85 backdrop-blur shadow-md">
          {/* +/- column */}
          <div className="flex w-11 flex-col border-r border-[#0092B8]/60 text-white shrink-0">
            <button
              type="button"
              aria-label="Increase investment"
              onClick={() => setInvestment((v) => v + 1)}
              className="flex flex-1 items-center justify-center border-b border-[#0092B8]/60 hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              <Plus className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Decrease investment"
              onClick={() => setInvestment((v) => Math.max(1, v - 1))}
              className="flex flex-1 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              <Minus className="size-5" />
            </button>
          </div>

          {/* Investment value & label */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tracking-tight leading-tight">
              ${investment.toFixed(0)}
            </span>
            <span className="text-xs text-white/70 font-normal leading-tight">
              Investment
            </span>
          </div>
        </div>

        {/* Center: SELL & BUY Actions */}
        <div className="flex h-19 w-125 overflow-hidden rounded-2xl border border-[#0092B8] bg-[#031d27]/90 backdrop-blur shadow-lg">
          {/* SELL button */}
          <button
            type="button"
            disabled={isPlacingTrade}
            onClick={() => executeTrade("sell")}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-3 bg-linear-to-r from-[#240407] via-[#3d080d] to-[#240407] border-r border-[#0092B8]/60 hover:brightness-125 active:scale-[0.99] transition-all cursor-pointer overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Circle with Down arrow */}
            <div className="relative flex size-6.5 items-center justify-center rounded-full border-2 border-[#FF2E4D] text-[#FF2E4D]">
              {isPlacingTrade ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
            </div>
            <span className="relative text-2xl font-bold tracking-wider text-[#FF2E4D]">
              SELL
            </span>
          </button>

          {/* BUY button */}
          <button
            type="button"
            disabled={isPlacingTrade}
            onClick={() => executeTrade("buy")}
            className={cn(
              "group relative flex flex-1 items-center justify-center gap-3 bg-linear-to-r from-[#031c10] via-[#06331c] to-[#031c10] hover:brightness-125 active:scale-[0.99] transition-all cursor-pointer overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Circle with Up arrow */}
            <div className="relative flex size-6.5 items-center justify-center rounded-full border-2 border-[#00E676] text-[#00E676]">
              {isPlacingTrade ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              )}
            </div>
            <span className="relative text-2xl font-bold tracking-wider text-[#00E676]">
              BUY
            </span>
          </button>
        </div>

        {/* Right: Auto Close Box */}
        <div className="flex h-19 w-52 overflow-hidden rounded-2xl border border-[#0092B8] bg-[#053345]/85 backdrop-blur shadow-md">
          {/* Auto Close value & label */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white tracking-tight leading-tight">
              {formatTime(seconds)}
            </span>
            <span className="text-xs text-white/70 font-normal leading-tight">
              Auto Close
            </span>
          </div>

          {/* +/- column */}
          <div className="flex w-11 flex-col border-l border-[#0092B8]/60 text-white shrink-0">
            <button
              type="button"
              aria-label="Increase auto close duration"
              onClick={() => setSeconds((s) => s + 30)}
              className="flex flex-1 items-center justify-center border-b border-[#0092B8]/60 hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              <Plus className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Decrease auto close duration"
              onClick={() => setSeconds((s) => Math.max(5, s - 30))}
              className="flex flex-1 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
            >
              <Minus className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
