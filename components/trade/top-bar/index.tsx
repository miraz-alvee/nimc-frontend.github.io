"use client";

import { useState, useRef, useEffect } from "react";
import { Panel } from "@/components/shared/panel";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { BottomTradeBar } from "./bottom-bar";
import { useTrading } from "../trading-context";
import { AssetIcon } from "../right-sidebar/trends/asset-icons";
import { cn } from "@/lib/utils";
import type { TradingAsset } from "@/apis";

export { BottomTradeBar };

export function TopBar() {
  const {
    displayBalance,
    selectedAsset,
    assets,
    setSelectedAsset,
  } = useTrading();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const filteredAssets = assets.filter(
    (a) =>
      search.trim() === "" ||
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (asset: TradingAsset) => {
    setSelectedAsset(asset);
    setIsDropdownOpen(false);
    setSearch("");
  };

  const payout = selectedAsset?.payout_percent
    ? parseInt(selectedAsset.payout_percent, 10)
    : 80;

  return (
    <>
      {/* Top Center: Available Balance & Asset selector */}
      <div className="absolute left-1/2 top-5 z-40 flex -translate-x-1/2 flex-col items-center gap-3 font-albert-sans">
        {/* Balance Panel */}
        <Panel className="flex w-60 flex-col items-center py-2.5">
          <span className="text-3xl font-medium text-[#FAFAFA]">${displayBalance}</span>
          <span className="text-xl font-medium text-[#00B8DB]">Available balance</span>
        </Panel>

        {/* Asset Selector Button with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Panel>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex h-10 items-center gap-2.5 px-3.5 text-sm text-white cursor-pointer hover:bg-cyan-400/10 transition-colors rounded-lg select-none"
            >
              <AssetIcon symbol={selectedAsset?.symbol} className="size-5 shrink-0" />
              <span className="font-medium">
                {selectedAsset?.display_name || selectedAsset?.symbol || "EUR/USD (OTC)"}
              </span>
              <span className="text-xs font-bold text-[#00E676] bg-[#00E676]/15 px-1.5 py-0.5 rounded leading-none">
                +{payout}%
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-white/70 transition-transform duration-200",
                  isDropdownOpen && "rotate-180 text-[#00E5FF]"
                )}
              />
            </button>
          </Panel>

          {/* Asset Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 max-h-96 rounded-xl border border-[#0092B8] bg-[#053345] shadow-2xl p-3 z-50 flex flex-col text-white backdrop-blur">
              {/* Search in dropdown */}
              <div className="relative flex items-center mb-2.5">
                <Search className="absolute left-2.5 size-3.5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pairs..."
                  autoFocus
                  className="w-full h-8 pl-8 pr-7 text-xs bg-[#002432] border border-[#0092B8]/40 rounded-lg text-white placeholder-white/40 focus:outline-hidden focus:border-[#00E5FF] transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 text-white/50 hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Assets list */}
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1 max-h-72">
                {filteredAssets.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/50">
                    No assets found
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    const aPayout = asset.payout_percent
                      ? parseInt(asset.payout_percent, 10)
                      : 80;

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelect(asset)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer select-none",
                          isSelected
                            ? "bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-white"
                            : "hover:bg-white/5 text-white/80 hover:text-white border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AssetIcon symbol={asset.symbol} className="size-6 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold truncate leading-tight">
                              {asset.symbol}
                            </span>
                            <span className="text-[10px] text-white/50 truncate leading-tight">
                              {asset.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded leading-none">
                            +{aPayout}%
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 text-[#00E5FF]" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Center: Chart controls & Trade panel */}
      <BottomTradeBar />
    </>
  );
}
