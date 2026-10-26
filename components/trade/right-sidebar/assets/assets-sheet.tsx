"use client";

import { useMemo, useState } from "react";
import { Search, X, RotateCw, AlertTriangle, Check } from "lucide-react";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { useAssetsQuery } from "@/apis";
import { AssetIcon } from "../trends/asset-icons";
import { useTrading } from "@/components/trade/trading-context";
import { cn } from "@/lib/utils";
import type { TradingAsset } from "@/apis";

type AssetCategory = "all" | "currencies" | "crypto" | "commodities";

export function AssetsSheet(props: SheetProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AssetCategory>("all");
  const { selectedAsset, setSelectedAsset } = useTrading();

  const {
    data: assets,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAssetsQuery({
    enabled: props.open,
    refetchInterval: props.open ? 10000 : false,
  });

  const filteredAssets = useMemo(() => {
    if (!assets) return [];

    return assets.filter((asset) => {
      // Search filter
      const matchesSearch =
        search.trim() === "" ||
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
        asset.display_name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (category === "all") return true;

      const sym = asset.symbol.toUpperCase();
      const name = asset.name.toUpperCase();

      if (category === "currencies") {
        return sym.includes("/") || sym.includes("USD") || sym.includes("EUR") || sym.includes("JPY");
      }
      if (category === "crypto") {
        return (
          sym.includes("CRYPTO") ||
          sym.includes("ALTCOIN") ||
          sym.includes("SMARTY") ||
          sym.includes("BTC") ||
          sym.includes("ETH") ||
          name.includes("CRYPTO")
        );
      }
      if (category === "commodities") {
        return (
          sym.includes("GOLD") ||
          sym.includes("SILVER") ||
          sym.includes("OIL") ||
          sym.includes("BRENT") ||
          name.includes("GOLD") ||
          name.includes("OIL") ||
          name.includes("SILVER")
        );
      }

      return true;
    });
  }, [assets, search, category]);

  const formatPrice = (price?: string | number | null) => {
    if (price === undefined || price === null || price === "") return "--";
    const num = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(num)) return String(price);

    if (num < 10) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 5 });
    }
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSelectAsset = (asset: TradingAsset) => {
    setSelectedAsset(asset);
  };

  return (
    <SideSheet
      {...props}
      side="right"
      title="Assets"
      showHeader={false}
      className="p-0 flex flex-col font-albert-sans"
    >
      {/* Custom Header with Refresh and Count */}
      <div className="sticky top-0 z-10 bg-[#053345] px-5 pt-6 pb-3 border-b border-[#0092B8]/40 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-normal text-white">Assets</h2>
            {assets && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                {assets.length}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Refresh assets"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg text-white/70 hover:text-[#00E5FF] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh assets"
          >
            <RotateCw className={cn("size-4", isFetching && "animate-spin text-[#00E5FF]")} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets (e.g. EUR, Crypto)..."
            className="w-full h-9 pl-9 pr-8 text-xs bg-[#002432] border border-[#0092B8]/40 rounded-lg text-white placeholder-white/40 focus:outline-hidden focus:border-[#00E5FF] transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 text-white/50 hover:text-white transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "currencies", label: "Currencies" },
              { key: "crypto", label: "Crypto" },
              { key: "commodities", label: "Commodities" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setCategory(tab.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer select-none",
                category === tab.key
                  ? "bg-[#00E5FF] text-[#053345] shadow-xs shadow-[#00E5FF]/30 font-semibold"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-1 px-3">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-transparent animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-24 bg-white/10 rounded-sm" />
                    <div className="h-2.5 w-16 bg-white/5 rounded-sm" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3.5 w-14 bg-white/10 rounded-sm" />
                  <div className="h-2.5 w-10 bg-[#00E676]/20 rounded-sm" />
                </div>
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
            <p className="text-sm font-medium text-white mb-1">Failed to load assets</p>
            <p className="text-xs text-white/60 mb-4 max-w-[200px]">
              {error?.message || "Could not retrieve trading assets. Please try again."}
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

        {/* Empty State */}
        {!isLoading && !isError && filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white/60">
            <Search className="size-8 text-white/30 mb-2" />
            <p className="text-sm font-medium text-white mb-0.5">No assets found</p>
            <p className="text-xs">
              {search
                ? `No results matching "${search}"`
                : "No assets available in this category"}
            </p>
          </div>
        )}

        {/* Assets List */}
        {!isLoading && !isError && filteredAssets.length > 0 && (
          <div className="flex flex-col">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;

              return (
                <div
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className={cn(
                    "flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] transition-all cursor-pointer select-none border-l-2",
                    isSelected
                      ? "border-[#00E5FF] bg-[#00E5FF]/[0.06]"
                      : "border-transparent"
                  )}
                >
                  {/* Left: Icon & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <AssetIcon symbol={asset.symbol} className="size-7 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white leading-tight truncate">
                          {asset.symbol}
                        </span>
                        {asset.is_otc && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/10 text-white/80 shrink-0">
                            OTC
                          </span>
                        )}
                        {isSelected && (
                          <Check className="size-3.5 text-[#00E5FF] shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-white/60 leading-tight truncate mt-0.5">
                        {asset.name}
                      </span>
                    </div>
                  </div>

                  {/* Right: Price & Payout */}
                  <div className="flex flex-col items-end shrink-0 pl-3">
                    <span className="text-sm font-medium text-white leading-tight font-mono">
                      {formatPrice(asset.price)}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-semibold text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded leading-none">
                        +{parseInt(asset.payout_percent, 10) || 80}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SideSheet>
  );
}
