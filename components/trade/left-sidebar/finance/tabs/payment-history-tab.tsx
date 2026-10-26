"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Check,
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  usePaymentsQuery,
  useAuth,
  type Payment,
  type PaymentStatusEnum,
} from "@/apis";
import { cn } from "@/lib/utils";

type FilterType = "all" | "deposit" | "withdrawal";

export function PaymentHistoryTab() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    error,
  } = usePaymentsQuery(page, {
    enabled: isAuthenticated,
  });

  const handleCopy = (ref: string) => {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    toast.success("Reference copied!");
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: PaymentStatusEnum) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="size-2.5" /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Failed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-white/60 border border-white/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-white/60 border border-white/20">
            {status}
          </span>
        );
    }
  };

  const allPayments = data?.results || [];
  const filteredPayments = allPayments.filter((p) => {
    if (filter === "all") return true;
    return p.kind === filter;
  });

  const totalCount = data?.count || 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="p-3.5 space-y-3.5 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Filters and Refresh Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#032331] p-1 rounded-xl border border-[#005F78]">
          {(["all", "deposit", "withdrawal"] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer",
                filter === f
                  ? "bg-[#00B8DB] text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              )}
            >
              {f === "all" ? "All" : f === "deposit" ? "Deposits" : "Withdrawals"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh transaction history"
          className="p-2 rounded-xl border border-[#005F78] bg-[#032331] text-white/70 hover:text-[#00E5FF] hover:border-[#0092B8] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin text-[#00E5FF]")} />
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-[#005F78]/50 bg-[#032331]/50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 text-center">
          Failed to load transactions. Please try refreshing.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPayments.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="size-14 rounded-2xl bg-[#032331] border border-[#005F78] flex items-center justify-center text-white/40">
            <Wallet className="size-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No transactions found</p>
            <p className="text-xs text-white/50 mt-1">
              {filter === "all"
                ? "You haven't made any deposits or withdrawals yet."
                : `No ${filter} transactions recorded yet.`}
            </p>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && filteredPayments.length > 0 && (
        <div className="space-y-2.5">
          {filteredPayments.map((item: Payment) => {
            const isDeposit = item.kind === "deposit";
            const isWithdrawal = item.kind === "withdrawal";

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[#005F78] bg-[#032331]/90 hover:border-[#0092B8] transition-colors space-y-2 text-xs"
              >
                {/* Header row: Kind icon, Title & Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0",
                        isDeposit
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isWithdrawal
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/30"
                      )}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="size-4" />
                      ) : isWithdrawal ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <Wallet className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white capitalize">
                        {item.kind} • <span className="uppercase text-white/70">{item.method}</span>
                      </div>
                      <div className="text-[11px] text-white/50">{formatDate(item.created_at)}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={cn(
                        "text-sm font-bold",
                        isDeposit
                          ? "text-emerald-400"
                          : isWithdrawal
                          ? "text-rose-400"
                          : "text-white"
                      )}
                    >
                      {isDeposit ? "+" : isWithdrawal ? "-" : ""}${parseFloat(item.amount).toFixed(2)}
                    </div>
                    <div className="mt-0.5">{renderStatusBadge(item.status)}</div>
                  </div>
                </div>

                {/* Sub row: Reference code & destination */}
                <div className="pt-2 border-t border-[#005F78]/40 flex items-center justify-between text-[11px] text-white/60">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white/40">Ref:</span>
                    <span>{item.reference || `#${item.id}`}</span>
                    {item.reference && (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.reference)}
                        aria-label="Copy reference"
                        className="text-white/40 hover:text-[#00E5FF] transition-colors cursor-pointer"
                      >
                        {copiedRef === item.reference ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {item.destination && (
                    <div className="truncate max-w-[140px] text-white/50 text-right" title={item.destination}>
                      to: {item.destination}
                    </div>
                  )}
                </div>

                {/* Note row if present */}
                {item.note && (
                  <div className="text-[11px] text-white/50 italic bg-[#021822] px-2 py-1 rounded">
                    &quot;{item.note}&quot;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between text-xs text-white/60">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#005F78] bg-[#032331] text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="size-3.5" /> Previous
          </button>

          <span>
            Page <strong className="text-white">{page}</strong> of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || isFetching || !data?.next}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#005F78] bg-[#032331] text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
