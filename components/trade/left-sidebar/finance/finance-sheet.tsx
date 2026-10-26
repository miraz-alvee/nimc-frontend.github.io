"use client";

import { useState } from "react";
import { Wallet, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";
import { DepositTab } from "./tabs/deposit-tab";
import { PaymentHistoryTab } from "./tabs/payment-history-tab";
import { WithdrawTab } from "./tabs/withdraw-tab";
import { SheetProps, SideSheet } from "@/components/shared/side-sheet";
import { TabToggle } from "@/components/shared/tab-toggle";
import { useAuth, useBalanceQuery } from "@/apis";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "deposit", label: "Deposit", Content: DepositTab },
  { value: "history", label: "Payment History", Content: PaymentHistoryTab },
  { value: "withdraw", label: "Withdraw", Content: WithdrawTab },
];

export function FinanceSheet(props: SheetProps) {
  const [tab, setTab] = useState("deposit");
  const { isAuthenticated } = useAuth();

  const {
    data: balance,
    isLoading: isLoadingBalance,
    isFetching: isFetchingBalance,
    refetch: refetchBalance,
  } = useBalanceQuery({
    enabled: props.open && isAuthenticated,
  });

  const currentTab = TABS.find((t) => t.value === tab);
  const title = currentTab ? currentTab.label : "Finance";
  const ActiveContent = currentTab?.Content;

  return (
    <SideSheet {...props} side="left" title={title}>
      <div className="flex flex-col h-full font-albert-sans select-none">
        {/* Wallet Balance Hero Card (Available when authenticated) */}
        {isAuthenticated && (
          <div className="p-4 border-b border-[#0092B8]/30 bg-[#032331]/80 shrink-0">
            <div className="rounded-xl border border-[#005F78] bg-linear-to-br from-[#042d3d] to-[#021f2b] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60 flex items-center gap-1.5 font-medium">
                  <Wallet className="size-3.5 text-[#00E5FF]" /> Available Balance
                </span>
                <button
                  type="button"
                  onClick={() => refetchBalance()}
                  disabled={isFetchingBalance}
                  aria-label="Refresh balance"
                  className="text-white/60 hover:text-[#00E5FF] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("size-3", isFetchingBalance && "animate-spin text-[#00E5FF]")} />
                </button>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {isLoadingBalance ? (
                    <span className="text-white/50 text-base font-normal">Loading balance...</span>
                  ) : (
                    `$${parseFloat(balance?.available_balance || "0").toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ${balance?.currency || "USD"}`
                  )}
                </div>

                {balance?.broker_connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="size-2.5" /> {balance.broker || "Connected"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Standard Wallet
                  </span>
                )}
              </div>

              {balance?.broker_balance && balance.broker_connected && (
                <div className="pt-2 border-t border-[#005F78]/40 flex items-center justify-between text-[11px] text-white/50">
                  <span>Broker Pool:</span>
                  <span className="font-medium text-white/80">${balance.broker_balance}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unauthenticated State */}
        {!isAuthenticated && (
          <div className="p-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
              <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Sign In Required</p>
                <p className="text-white/70 mt-0.5">
                  Please sign in to make deposits, request withdrawals, and track your payment history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Toggle Navigation */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <TabToggle
            tabs={TABS.map(({ value, label }) => ({ value, label }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        {/* Active Tab Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {ActiveContent && <ActiveContent />}
        </div>
      </div>
    </SideSheet>
  );
}
