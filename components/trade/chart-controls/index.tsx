"use client";

import { ZoomIn, ZoomOut, TrendingUp } from "lucide-react";

type Props = {
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
};

export function ChartControls({ zoom = 100, onZoomIn, onZoomOut }: Props) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* Chart type button */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#0092B8] bg-[#053345]/80 backdrop-blur shadow-sm">
        <button
          type="button"
          aria-label="Chart type"
          className="flex size-7 items-center justify-center rounded-md border border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/25 transition-colors cursor-pointer"
        >
          <TrendingUp className="size-4" strokeWidth={2.2} />
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex h-10 items-center rounded-xl border border-[#0092B8] bg-[#053345]/80 backdrop-blur text-white overflow-hidden shadow-sm">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={onZoomIn}
          className="flex size-10 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
        >
          <ZoomIn className="size-4.5 text-white/90" />
        </button>

        <div className="flex h-full items-center justify-center border-x border-[#0092B8]/60 px-4 text-sm font-medium text-white min-w-16">
          {zoom}%
        </div>

        <button
          type="button"
          aria-label="Zoom out"
          onClick={onZoomOut}
          className="flex size-10 items-center justify-center hover:bg-cyan-400/10 active:bg-cyan-400/20 transition-colors cursor-pointer"
        >
          <ZoomOut className="size-4.5 text-white/90" />
        </button>
      </div>
    </div>
  );
}
