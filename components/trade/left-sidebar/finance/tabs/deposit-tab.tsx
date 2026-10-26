"use client";

import { useState } from "react";
import { CreditCard, Building2, Coins, Loader2, ShieldCheck, ArrowDownRight } from "lucide-react";
import toast from "react-hot-toast";
import { useDepositMutation, useAuth, formatApiError, type MethodAc1Enum } from "@/apis";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = ["20", "50", "100", "250", "500", "1000"];

const PAYMENT_METHODS: { id: MethodAc1Enum; name: string; icon: typeof CreditCard }[] = [
  { id: "card", name: "Card", icon: CreditCard },
  { id: "bank", name: "Bank", icon: Building2 },
  { id: "crypto", name: "Crypto", icon: Coins },
];

export function DepositTab() {
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState("100");
  const [method, setMethod] = useState<MethodAc1Enum>("card");
  const [note, setNote] = useState("");

  const depositMutation = useDepositMutation({
    onSuccess: (data) => {
      toast.success(`Deposit of $${data.payment.amount} successful!`);
      setNote("");
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to make a deposit");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    depositMutation.mutate({
      amount: num.toFixed(2),
      method,
      note: note.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3.5 space-y-3.5 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* 1. Payment Method Selection (3-col compact) */}
      <div>
        <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Payment Method
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

      {/* 2. Amount Input & Quick Chips */}
      <div>
        <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Deposit Amount ($)
        </label>
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
            className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#005F78] bg-[#032331] text-sm font-medium text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
          />
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {QUICK_AMOUNTS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              className={cn(
                "py-1 px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer text-center",
                amount === val
                  ? "border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF]"
                  : "border-[#005F78]/80 bg-[#104E64]/60 text-white/80 hover:bg-[#104E64] hover:text-white"
              )}
            >
              +${val}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Optional Note */}
      <div>
        <label className="block mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Note (Optional)
        </label>
        <input
          type="text"
          maxLength={255}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Trading capital deposit"
          className="w-full h-9 px-3 rounded-xl border border-[#005F78] bg-[#032331] text-xs text-white focus:border-[#00E5FF] focus:outline-none transition-colors"
        />
      </div>

      {/* 4. Transaction Summary Card */}
      <div className="rounded-xl border border-[#005F78] bg-[#032331]/90 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-white/70">
          <span>Deposit Amount:</span>
          <span className="font-semibold text-white">
            ${parseFloat(amount || "0").toFixed(2)} USD
          </span>
        </div>
        <div className="flex items-center justify-between text-white/70">
          <span>Payment Fee:</span>
          <span className="text-[#00E5FF] font-medium">$0.00 (Free)</span>
        </div>
        <div className="pt-1.5 border-t border-[#005F78]/50 flex items-center justify-between text-white">
          <span className="font-medium">Total Credited:</span>
          <span className="text-sm font-bold text-[#00E5FF]">
            ${parseFloat(amount || "0").toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/50">
        <ShieldCheck className="size-3.5 text-[#00E5FF] shrink-0" />
        <span>256-bit encrypted secure transaction processing.</span>
      </div>

      {/* 5. Submit Button */}
      <button
        type="submit"
        disabled={depositMutation.isPending || !amount || parseFloat(amount) <= 0}
        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-black bg-[#00B8DB] hover:bg-[#00d0f7] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {depositMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Processing Deposit...</span>
          </>
        ) : (
          <>
            <ArrowDownRight className="size-4" />
            <span>Deposit ${parseFloat(amount || "0").toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
}
