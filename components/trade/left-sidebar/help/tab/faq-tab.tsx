"use client";

import { useState } from "react";
import { ChevronDown, Search, HelpCircle, X } from "lucide-react";
import { useFaqsQuery, type Faq } from "@/apis";
import { cn } from "@/lib/utils";

export default function FaqTab() {
  const { data: faqs = [], isLoading, error } = useFaqsQuery();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = faqs
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .filter((item) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-3.5 space-y-3 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search frequently asked questions..."
          className="w-full h-9.5 pl-9 pr-8 rounded-xl border border-[#005F78] bg-[#032331] text-xs text-white placeholder:text-white/40 focus:border-[#00E5FF] focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-[#005F78]/50 bg-[#032331]/60 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 text-center">
          Failed to load FAQs. Please try again later.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredFaqs.length === 0 && (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
          <HelpCircle className="size-8 text-white/30" />
          <p className="text-xs text-white/60">
            {search ? `No questions matching "${search}"` : "No FAQs available at this time."}
          </p>
        </div>
      )}

      {/* FAQ Accordion List */}
      {!isLoading && filteredFaqs.length > 0 && (
        <div className="space-y-2 pt-1">
          {filteredFaqs.map((faq: Faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={cn(
                  "rounded-xl border transition-all overflow-hidden",
                  isOpen
                    ? "border-[#00E5FF]/60 bg-[#032331] shadow-[0_0_12px_rgba(0,229,255,0.08)]"
                    : "border-[#005F78] bg-[#032331]/70 hover:border-[#0092B8]"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-3 flex items-center justify-between text-left gap-3 cursor-pointer"
                >
                  <span className="text-xs font-medium text-white flex-1 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-white/60 transition-transform duration-200",
                      isOpen && "rotate-180 text-[#00E5FF]"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-0 border-t border-[#005F78]/40 mt-1 text-xs text-white/75 leading-relaxed whitespace-pre-line">
                    <p className="pt-2">{faq.answer}</p>
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
