"use client";

import { useState, useRef } from "react";
import { ChevronDown, Loader2, Upload, X, ShieldAlert, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useFeedbackMutation, useAuth, formatApiError, type CategoryEnum } from "@/apis";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: CategoryEnum; label: string }[] = [
  { id: "general", label: "General Inquiry" },
  { id: "account", label: "Account & Verification" },
  { id: "finance", label: "Finance & Deposits/Withdrawals" },
  { id: "trading", label: "Trading & Orders" },
  { id: "technical", label: "Technical Bug / Issue" },
];

type Props = {
  onSuccessNavigate?: () => void;
};

export default function FeedbackTab({ onSuccessNavigate }: Props) {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CategoryEnum>("general");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const feedbackMutation = useFeedbackMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccessNavigate?.();
    },
    onError: (err) => {
      toast.error(formatApiError(err));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      toast.error("Attachment file size must not exceed 5 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to submit feedback");
      return;
    }

    if (title.trim().length < 4) {
      toast.error("Title must be at least 4 characters long");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }

    feedbackMutation.mutate({
      category,
      title: title.trim(),
      description: description.trim(),
      attachment: file,
    });
  };

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label || "General Inquiry";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3.5 space-y-3.5 font-albert-sans select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Unauthenticated Alert */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Sign In Required</p>
            <p className="text-white/70 mt-0.5">
              Please sign in from the left menu before submitting feedback or support requests.
            </p>
          </div>
        </div>
      )}

      {/* Category Dropdown */}
      <div className="relative">
        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-white/70">
          Category
        </label>
        <button
          type="button"
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className="w-full h-10 px-3 bg-[#032331] border border-[#005F78] rounded-xl text-xs font-medium flex justify-between items-center text-white hover:border-[#0092B8] transition-colors cursor-pointer"
        >
          <span>{selectedCategoryLabel}</span>
          <ChevronDown
            className={cn("size-4 text-white/70 transition-transform", isCategoryOpen && "rotate-180 text-[#00E5FF]")}
          />
        </button>

        {isCategoryOpen && (
          <div className="absolute left-0 right-0 top-16 z-20 rounded-xl border border-[#005F78] bg-[#032331] p-1.5 shadow-xl space-y-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setIsCategoryOpen(false);
                }}
                className={cn(
                  "w-full px-2.5 py-2 text-left text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer",
                  category === cat.id
                    ? "bg-[#00E5FF]/15 text-[#00E5FF] font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span>{cat.label}</span>
                {category === cat.id && <Check className="size-3.5 text-[#00E5FF]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Title Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Title
          </label>
          <span className="text-[10px] text-white/40">{title.length} / 255</span>
        </div>
        <input
          type="text"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your inquiry..."
          required
          className="w-full h-10 px-3 bg-[#032331] border border-[#005F78] rounded-xl text-xs text-white placeholder:text-white/40 focus:border-[#00E5FF] focus:outline-none transition-colors"
        />
        <p className="text-[10px] text-white/50 mt-1">Between 4 and 255 characters</p>
      </div>

      {/* Description Textarea */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Description
          </label>
          <span className="text-[10px] text-white/40">{description.length} chars</span>
        </div>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe your issue, feedback, or suggestion in detail..."
          required
          className="w-full p-3 bg-[#032331] border border-[#005F78] rounded-xl text-xs text-white placeholder:text-white/40 focus:border-[#00E5FF] focus:outline-none transition-colors resize-none"
        />
        <p className="text-[10px] text-white/50 mt-0.5">Must be at least 10 characters long</p>
      </div>

      {/* File Upload Input */}
      <div>
        <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-white/70">
          Upload Attachment (Optional)
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="feedback-file-input"
          />
          {!file ? (
            <label
              htmlFor="feedback-file-input"
              className="w-full h-10 px-3 rounded-xl border border-dashed border-[#005F78] bg-[#032331]/80 hover:bg-[#032331] hover:border-[#0092B8] text-xs text-white/60 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="size-3.5 text-[#00E5FF]" />
              <span>Choose file (Image, PDF up to 5 MB)</span>
            </label>
          ) : (
            <div className="w-full h-10 px-3 rounded-xl border border-[#005F78] bg-[#032331] flex items-center justify-between text-xs text-white">
              <span className="truncate max-w-[200px] text-white/90">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-white/50 hover:text-rose-400 p-1 cursor-pointer transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={feedbackMutation.isPending}
          className="w-1/3 py-2.5 px-3 text-xs font-medium text-white/80 bg-[#104E64] border border-[#005F78] rounded-xl hover:bg-[#14617d] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          Clear
        </button>

        <button
          type="submit"
          disabled={feedbackMutation.isPending || !title.trim() || !description.trim() || !isAuthenticated}
          className="flex-1 py-2.5 px-4 text-xs font-semibold text-black bg-[#00B8DB] border border-[#005F78] rounded-xl hover:bg-[#00d0f7] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {feedbackMutation.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit Feedback</span>
          )}
        </button>
      </div>
    </form>
  );
}
