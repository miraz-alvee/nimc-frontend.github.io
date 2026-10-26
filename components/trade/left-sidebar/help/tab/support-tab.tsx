"use client";

import { MessageSquare, Plus, ExternalLink, ShieldAlert, Headphones, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { useSupportTicketsQuery, useAuth, type Feedback, type CategoryEnum, type FeedbackStatusEnum } from "@/apis";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<CategoryEnum, string> = {
  general: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  account: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  finance: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  trading: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  technical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

type Props = {
  onOpenFeedback?: () => void;
};

export default function SupportTab({ onOpenFeedback }: Props) {
  const { isAuthenticated } = useAuth();
  const { data: tickets = [], isLoading, isFetching, refetch, error } = useSupportTicketsQuery({
    enabled: isAuthenticated,
  });

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

  const renderStatus = (status: FeedbackStatusEnum) => {
    if (status === "open") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
          <Clock className="size-2.5" /> Open
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-white/10 text-white/60 border border-white/20">
        <CheckCircle2 className="size-2.5" /> Closed
      </span>
    );
  };

  return (
    <div className="p-3.5 space-y-3.5 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Support Channels Banner */}
      <div className="rounded-xl border border-[#005F78] bg-[#032331]/90 p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Headphones className="size-3.5 text-[#00E5FF]" /> 24/7 Client Support
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
        </div>
        <p className="text-[11px] text-white/60 leading-snug">
          Need immediate assistance? Our dedicated trading specialists are available around the clock.
        </p>
        <div className="pt-2 border-t border-[#005F78]/40 flex items-center justify-between text-xs text-white/70">
          <span>Official Support:</span>
          <span className="font-mono text-[#00E5FF] text-[11px]">support@nimc.com</span>
        </div>
      </div>

      {/* Header with New Ticket CTA & Refresh */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          My Support Requests ({tickets.length})
        </span>

        <div className="flex items-center gap-1.5">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh tickets"
              className="p-1.5 rounded-lg border border-[#005F78] bg-[#032331] text-white/60 hover:text-[#00E5FF] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3", isFetching && "animate-spin text-[#00E5FF]")} />
            </button>
          )}

          {onOpenFeedback && (
            <button
              type="button"
              onClick={onOpenFeedback}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00B8DB] text-black text-xs font-medium hover:bg-[#00d0f7] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="size-3.5" />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Unauthenticated Alert */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
          <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Sign In Required</p>
            <p className="text-white/70 mt-0.5">
              Please sign in to track your support tickets and communicate with our helpdesk.
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-[#005F78]/50 bg-[#032331]/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 text-center">
          Failed to load support requests. Please try refreshing.
        </div>
      )}

      {/* Empty State */}
      {isAuthenticated && !isLoading && !error && tickets.length === 0 && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
          <div className="size-12 rounded-xl bg-[#032331] border border-[#005F78] flex items-center justify-center text-white/40">
            <MessageSquare className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">No active support requests</p>
            <p className="text-[11px] text-white/50 mt-0.5">
              Have an issue or inquiry? Submit a ticket via the Feedback tab.
            </p>
          </div>
          {onOpenFeedback && (
            <button
              type="button"
              onClick={onOpenFeedback}
              className="mt-1 text-xs px-3 py-1.5 rounded-lg border border-[#00B8DB]/50 text-[#00E5FF] hover:bg-[#00B8DB]/10 transition-colors cursor-pointer"
            >
              Submit Feedback / Ticket
            </button>
          )}
        </div>
      )}

      {/* Ticket List */}
      {!isLoading && tickets.length > 0 && (
        <div className="space-y-2.5">
          {tickets.map((ticket: Feedback) => {
            const catColor = CATEGORY_COLORS[ticket.category] || "bg-white/10 text-white border-white/20";

            return (
              <div
                key={ticket.id}
                className="p-3 rounded-xl border border-[#005F78] bg-[#032331]/90 hover:border-[#0092B8] transition-colors space-y-2 text-xs"
              >
                {/* Header: Title and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white truncate block">
                      {ticket.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium uppercase border", catColor)}>
                        {ticket.category}
                      </span>
                      <span className="text-[11px] text-white/50">{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">{renderStatus(ticket.status)}</div>
                </div>

                {/* Description snippet */}
                <p className="text-white/70 text-[11px] leading-relaxed line-clamp-3 bg-[#021c27] p-2 rounded border border-[#005F78]/40">
                  {ticket.description}
                </p>

                {/* Attachment Link if present */}
                {ticket.attachment && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Attachment:</span>
                    <a
                      href={ticket.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00E5FF] hover:underline flex items-center gap-1 font-medium"
                    >
                      View File <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
