"use client";

import { useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  RotateCw,
  AlertTriangle,
  Lock,
  ArrowDownUp,
  Clock,
} from "lucide-react";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { useAuth, useDealsQuery, type Deal } from "@/apis";
import { cn } from "@/lib/utils";

type DealFilter = "all" | "open" | "closed";

export function DealsSheet(props: SheetProps) {
  const [filter, setFilter] = useState<DealFilter>("all");
  const [page, setPage] = useState(1);
  const { isAuthenticated } = useAuth();

  const {
    data: dealsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDealsQuery(page, {
    enabled: props.open && isAuthenticated,
    refetchInterval: props.open && isAuthenticated ? 5000 : false,
  });

  // Group deals by date
  const groupedDeals = useMemo(() => {
    if (!dealsData?.results) return [];

    const filtered = dealsData.results.filter((deal) => {
      if (filter === "all") return true;
      if (filter === "open") return deal.status === "open";
      if (filter === "closed") return deal.status !== "open";
      return true;
    });

    const groupsMap = new Map<string, Deal[]>();

    filtered.forEach((deal) => {
      let dateKey = "Recent Deals";
      if (deal.opened_at) {
        try {
          const d = new Date(deal.opened_at);
          const now = new Date();
          const isToday =
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();

          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          const isYesterday =
            d.getDate() === yesterday.getDate() &&
            d.getMonth() === yesterday.getMonth() &&
            d.getFullYear() === yesterday.getFullYear();

          if (isToday) {
            dateKey = `Today, ${d.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
          } else if (isYesterday) {
            dateKey = `Yesterday, ${d.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
          } else {
            dateKey = d.toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          }
        } catch {
          dateKey = "Recent Deals";
        }
      }

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey)!.push(deal);
    });

    return Array.from(groupsMap.entries()).map(([date, deals]) => ({
      date,
      deals,
    }));
  }, [dealsData, filter]);

  const formatDealTime = (isoString?: string) => {
    if (!isoString) return "--:--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (val?: string | number | null) => {
    if (val === null || val === undefined || val === "") return "$0.00";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return `$${val}`;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SideSheet
      {...props}
      side="right"
      title="Recent Deals"
      showHeader={false}
      className="p-0 flex flex-col font-albert-sans"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#053345] px-5 pt-6 pb-3 border-b border-[#0092B8]/40 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-normal text-white">Recent Deals</h2>
            {dealsData && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                {dealsData.count}
              </span>
            )}
          </div>
          {isAuthenticated && (
            <button
              type="button"
              aria-label="Refresh deals"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-white/70 hover:text-[#00E5FF] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh deals"
            >
              <RotateCw className={cn("size-4", isFetching && "animate-spin text-[#00E5FF]")} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {isAuthenticated && (
          <div className="flex items-center gap-1.5">
            {(
              [
                { key: "all", label: "All" },
                { key: "open", label: "Open" },
                { key: "closed", label: "Closed" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none",
                  filter === tab.key
                    ? "bg-[#00E5FF] text-[#053345] shadow-xs shadow-[#00E5FF]/30 font-semibold"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Unauthenticated State */}
        {!isAuthenticated && (
          <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
            <div className="size-14 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] mb-4 shadow-lg shadow-[#00E5FF]/10">
              <Lock className="size-6" />
            </div>
            <h3 className="text-base font-medium text-white mb-1.5">Sign In Required</h3>
            <p className="text-xs text-white/60 mb-5 max-w-[220px] leading-relaxed">
              Sign in to your account to view your live and past trading deals in real time.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isAuthenticated && isLoading && (
          <div className="flex flex-col gap-3 px-5 py-3">
            <div className="h-3 w-24 bg-white/10 rounded-sm animate-pulse mb-1" />
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-24 bg-white/10 rounded-sm" />
                    <div className="h-2.5 w-16 bg-white/5 rounded-sm" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="h-3.5 w-16 bg-white/10 rounded-sm" />
                  <div className="h-2.5 w-12 bg-white/5 rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isAuthenticated && !isLoading && isError && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="size-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
              <AlertTriangle className="size-6" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Failed to load deals</p>
            <p className="text-xs text-white/60 mb-4 max-w-[200px]">
              {error?.message || "Could not retrieve your deals. Please try again."}
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
        {isAuthenticated && !isLoading && !isError && groupedDeals.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white/60 my-auto">
            <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
              <ArrowDownUp className="size-6" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No deals recorded</p>
            <p className="text-xs text-white/50 max-w-[220px]">
              {filter === "all"
                ? "You haven't placed any trades yet. Start trading to view your order history."
                : `No ${filter} deals found.`}
            </p>
          </div>
        )}

        {/* Deals Group List */}
        {isAuthenticated && !isLoading && !isError && groupedDeals.length > 0 && (
          <div className="flex flex-col">
            {groupedDeals.map((group, groupIdx) => (
              <div key={group.date} className={groupIdx > 0 ? "mt-2" : ""}>
                {/* Date Section Header */}
                <div className="px-5 py-2.5 text-xs text-white/70 font-normal">
                  {group.date}
                </div>

                {/* List of deals in group */}
                <div className="flex flex-col">
                  {group.deals.map((deal) => {
                    const isBuy = deal.direction === "buy";
                    const isOpen = deal.status === "open";
                    const isWon = deal.status === "won";
                    const isLost = deal.status === "lost";

                    return (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                      >
                        {/* Direction & Asset Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {isBuy ? (
                            <ChevronUp
                              className="size-5 text-[#00E676] shrink-0"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <ChevronDown
                              className="size-5 text-[#FF2E4D] shrink-0"
                              strokeWidth={2.5}
                            />
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-white leading-tight truncate">
                              {deal.display_name || deal.symbol}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-white/60 leading-tight mt-1">
                              <span>{formatDealTime(deal.opened_at)}</span>
                              {isOpen && (
                                <span className="flex items-center gap-1 text-[#00E5FF] font-medium text-[11px]">
                                  <Clock className="size-3" />
                                  {deal.seconds_remaining}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Profit / Investment */}
                        <div className="flex flex-col items-end shrink-0 pl-3">
                          {isOpen ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 animate-pulse">
                              LIVE
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "text-sm font-medium leading-tight font-mono",
                                isWon && "text-[#00E676]",
                                isLost && "text-[#FF2E4D]",
                                !isWon && !isLost && "text-white/70"
                              )}
                            >
                              {isWon && `+${formatCurrency(deal.profit)}`}
                              {isLost && `-${formatCurrency(deal.investment)}`}
                              {!isWon && !isLost && formatCurrency(deal.profit || "0")}
                            </span>
                          )}

                          <span className="text-xs text-white/60 leading-tight mt-1 font-mono">
                            {formatCurrency(deal.investment)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section Divider */}
                {groupIdx < groupedDeals.length - 1 && (
                  <div className="border-b border-[#0092B8]/40 my-1 mx-0" />
                )}
              </div>
            ))}

            {/* Pagination Controls */}
            {dealsData && dealsData.count > 10 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#0092B8]/30 mt-2 text-xs text-white/70">
                <button
                  type="button"
                  disabled={!dealsData.previous || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {Math.ceil(dealsData.count / 10)}
                </span>
                <button
                  type="button"
                  disabled={!dealsData.next || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SideSheet>
  );
}
