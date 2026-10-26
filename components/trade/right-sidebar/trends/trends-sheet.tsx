"use client";

import { ChevronUp, ChevronDown, RotateCw, AlertTriangle } from "lucide-react";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { useTrendsQuery, type TrendAsset } from "@/apis";
import { useTrading } from "@/components/trade/trading-context";
import { AssetIcon } from "./asset-icons";
import { cn } from "@/lib/utils";

function TrendRow({
  item,
  isSelected,
  onSelect,
}: {
  item: TrendAsset;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const sentiment = item.sentiment ? item.sentiment.toLowerCase() : "neutral";

  const statusLabel =
    sentiment === "buy" ? "Buy" : sentiment === "sell" ? "Sell" : "Neutral";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer select-none border-l-2",
        isSelected
          ? "border-[#00E5FF] bg-[#00E5FF]/[0.06]"
          : "border-transparent"
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <AssetIcon symbol={item.symbol || item.name} className="size-7 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-white leading-tight truncate">
            {item.display_name || item.name || item.symbol}
          </span>
          <span
            className={cn(
              "text-xs leading-tight mt-1 font-medium",
              sentiment === "buy" && "text-[#00E676]",
              sentiment === "sell" && "text-[#FF2E4D]",
              sentiment === "neutral" && "text-white/60"
            )}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center shrink-0 pl-3">
        {sentiment === "buy" && (
          <ChevronUp className="size-5 text-[#00E676]" strokeWidth={2.5} />
        )}
        {sentiment === "sell" && (
          <ChevronDown className="size-5 text-[#FF2E4D]" strokeWidth={2.5} />
        )}
        {sentiment === "neutral" && (
          <div className="w-3.5 h-[2px] bg-white rounded-full" />
        )}
      </div>
    </div>
  );
}

export function TrendsSheet(props: SheetProps) {
  const { assets, selectedAsset, setSelectedAsset } = useTrading();

  const {
    data: trends,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTrendsQuery({
    enabled: props.open,
    refetchInterval: props.open ? 10000 : false,
  });

  const handleSelectTrend = (item: TrendAsset) => {
    const matched = assets.find(
      (a) => a.id === item.id || a.symbol === item.symbol
    );
    if (matched) {
      setSelectedAsset(matched);
    }
  };

  return (
    <SideSheet
      {...props}
      side="right"
      title="Trends"
      showHeader={false}
      className="p-0 flex flex-col font-albert-sans"
    >
      {/* Custom Header with Refresh */}
      <div className="sticky top-0 z-10 bg-[#053345] px-5 pt-6 pb-4 border-b border-[#0092B8]/40 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-normal text-white">Trends</h2>
          <button
            type="button"
            aria-label="Refresh trends"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg text-white/70 hover:text-[#00E5FF] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh trends"
          >
            <RotateCw className={cn("size-4", isFetching && "animate-spin text-[#00E5FF]")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3 px-5 py-3">
            <div className="h-3 w-28 bg-white/10 rounded-sm animate-pulse mb-1" />
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="size-7 rounded-lg bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-24 bg-white/10 rounded-sm" />
                    <div className="h-2.5 w-14 bg-white/5 rounded-sm" />
                  </div>
                </div>
                <div className="size-4 bg-white/10 rounded-sm" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="size-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
              <AlertTriangle className="size-6" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Failed to load trends</p>
            <p className="text-xs text-white/60 mb-4 max-w-[200px]">
              {error?.message || "Could not retrieve trend data. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#00E5FF] text-[#053345] hover:bg-[#33ebff] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loaded Data */}
        {!isLoading && !isError && trends && (
          <>
            {/* Section 1: Selected assets */}
            {trends.selected && (
              <div>
                <div className="px-5 py-2.5 text-xs text-white/70 font-normal">
                  Selected assets:
                </div>
                <div className="flex flex-col">
                  <TrendRow
                    item={trends.selected}
                    isSelected={selectedAsset?.id === trends.selected.id}
                    onSelect={() => handleSelectTrend(trends.selected!)}
                  />
                </div>
                <div className="border-b border-[#0092B8]/40 my-1 mx-0" />
              </div>
            )}

            {/* Section 2: The most traded assets */}
            {trends.most_traded && trends.most_traded.length > 0 && (
              <div className={trends.selected ? "mt-1" : ""}>
                <div className="px-5 py-2.5 text-xs text-white/70 font-normal">
                  The most traded assets:
                </div>
                <div className="flex flex-col divide-y divide-[#0092B8]/30">
                  {trends.most_traded.map((item) => (
                    <TrendRow
                      key={item.id}
                      item={item}
                      isSelected={selectedAsset?.id === item.id}
                      onSelect={() => handleSelectTrend(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!trends.selected && (!trends.most_traded || trends.most_traded.length === 0) && (
              <div className="p-8 text-center text-white/60 text-xs">
                No active trends available at the moment.
              </div>
            )}
          </>
        )}
      </div>
    </SideSheet>
  );
}
