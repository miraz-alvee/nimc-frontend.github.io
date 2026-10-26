"use client";

import { useState } from "react";
import { CreditCard, Building2, Coins, Loader2, ArrowUpRight, AlertCircle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  useWithdrawalMutation,
  useBalanceQuery,
  useAuth,
  formatApiError,
  type MethodAc1Enum,
} from "@/apis";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS: { id: MethodAc1Enum; name: string; icon: typeof CreditCard; placeholder: string }[] = [
  {
    id: "crypto",
    name: "Crypto",
    icon: Coins,
    placeholder: "e.g. USDT TRC20 / ERC20 address",
  },
  {
    id: "bank",
    name: "Bank",
    icon: Building2,
    placeholder: "e.g. IBAN or Account Number",
  },
  {
    id: "card",
    name: "Card",
    icon: CreditCard,
    placeholder: "e.g. Card Number (16 digits)",
  },
];

const PERCENTAGES = [
  { label: "25%", factor: 0.25 },
  { label: "50%", factor: 0.5 },
  { label: "75%", factor: 0.75 },
  { label: "Max", factor: 1.0 },
];

export function WithdrawTab() {
  const { isAuthenticated } = useAuth();
  const { data: balanceData, isLoading: isLoadingBalance } = useBalanceQuery({
    enabled: isAuthenticated,
  });

  const availableBalance = parseFloat(balanceData?.available_balance || "0");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MethodAc1Enum>("crypto");
  const [destination, setDestination] = useState("");

  const withdrawalMutation = useWithdrawalMutation({
    onSuccess: (data) => {
      toast.success(`Withdrawal request of $${data.payment.amount} submitted!`);
      setAmount("");
      setDestination("");
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const numAmount = parseFloat(amount || "0");
  const isInsufficient = numAmount > availableBalance;
  const currentMethod = PAYMENT_METHODS.find((m) => m.id === method) || PAYMENT_METHODS[0];

  const handlePercentageClick = (factor: number) => {
    if (availableBalance <= 0) return;
    const calculated = (availableBalance * factor).toFixed(2);
    setAmount(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to make a withdrawal");
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (isInsufficient) {
      toast.error("Withdrawal amount exceeds available balance");
      return;
    }

    if (!destination.trim()) {
      toast.error("Please provide a destination address / account number");
      return;
    }

    withdrawalMutation.mutate({
      amount: numAmount.toFixed(2),
      method,
      destination: destination.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3.5 space-y-3.5 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 1. Available Balance Indicator */}
      <div className="rounded-xl border border-[#005F78] bg-[#032331]/80 p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 block">
            Withdrawable Balance
          </span>
          <span className="text-lg font-bold text-white">
            {isLoadingBalance ? "Loading..." : `$${availableBalance.toFixed(2)} ${balanceData?.currency || "USD"}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handlePercentageClick(1.0)}
          className="text-xs px-2.5 py-1 rounded-lg border border-[#00B8DB]/50 text-[#00E5FF] hover:bg-[#00B8DB]/10 transition-colors cursor-pointer"
        >
          All
        </button>
      </div>

      {/* 2. Method Selection (3-col compact) */}
      <div>
        <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Withdrawal Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((item) => {
            const Icon = item.icon;
            const isSelected = method === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMethod(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-center transition-all cursor-pointer",
                  isSelected
                    ? "border-[#00E5FF] bg-[#00B8DB]/20 text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                    : "border-[#005F78] bg-[#032331]/80 text-white/70 hover:bg-[#042838] hover:border-[#0092B8] hover:text-white"
                )}
              >
                <Icon className={cn("size-5", isSelected ? "text-[#00E5FF]" : "text-white/80")} />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Amount Input with Percentage Quick Buttons */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Amount ($)
          </label>
          {isInsufficient && (
            <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
              <AlertCircle className="size-3" /> Exceeds balance
            </span>
          )}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-medium text-[#00E5FF]">
            $
          </span>
          <input
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={cn(
              "w-full h-10 pl-7 pr-14 rounded-xl border bg-[#032331] text-sm font-medium text-white focus:outline-none transition-colors",
              isInsufficient ? "border-rose-500 focus:border-rose-400" : "border-[#005F78] focus:border-[#00E5FF]"
            )}
          />
          <button
            type="button"
            onClick={() => handlePercentageClick(1.0)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-semibold text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors cursor-pointer"
          >
            MAX
          </button>
        </div>

        {/* Quick Percentages */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {PERCENTAGES.map(({ label, factor }) => (
            <button
              key={label}
              type="button"
              onClick={() => handlePercentageClick(factor)}
              className="py-1 rounded-lg border border-[#005F78]/80 bg-[#104E64]/60 text-xs font-medium text-white/80 hover:bg-[#104E64] hover:text-white transition-all cursor-pointer text-center"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Destination Address / Account Input */}
      <div>
        <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Destination ({currentMethod.name})
        </label>
        <input
          type="text"
          maxLength={255}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={currentMethod.placeholder}
          className="w-full h-9 px-3 rounded-xl border border-[#005F78] bg-[#032331] text-xs text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
        />
      </div>

      {/* 5. Summary Card */}
      <div className="rounded-xl border border-[#005F78] bg-[#032331]/90 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-white/70">
          <span>Withdrawal Amount:</span>
          <span className="font-semibold text-white">
            ${numAmount > 0 ? numAmount.toFixed(2) : "0.00"} USD
          </span>
        </div>
        <div className="flex items-center justify-between text-white/70">
          <span>Processing Fee:</span>
          <span className="text-[#00E5FF] font-medium">$0.00 (Free)</span>
        </div>
        <div className="pt-1.5 border-t border-[#005F78]/50 flex items-center justify-between text-white">
          <span className="font-medium">Total Payout:</span>
          <span className="text-sm font-bold text-[#00E5FF]">
            ${numAmount > 0 ? numAmount.toFixed(2) : "0.00"} USD
          </span>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/50">
        <ShieldCheck className="size-3.5 text-[#00E5FF] shrink-0" />
        <span>Withdrawals are monitored and reviewed securely.</span>
      </div>

      {/* 6. Submit Button */}
      <button
        type="submit"
        disabled={
          withdrawalMutation.isPending ||
          !amount ||
          numAmount <= 0 ||
          isInsufficient ||
          !destination.trim()
        }
        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-black bg-[#00B8DB] hover:bg-[#00d0f7] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {withdrawalMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Submitting Request...</span>
          </>
        ) : (
          <>
            <ArrowUpRight className="size-4" />
            <span>Confirm Withdrawal</span>
          </>
        )}
      </button>
    </form>
  );
}
