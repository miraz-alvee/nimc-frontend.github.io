"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useLoginMutation, formatApiError, extractFieldErrors } from "@/apis";
import { cn } from "@/lib/utils";
import { GoogleIcon, AppleIcon } from "../social-icons";

type Props = {
  onSwitchTab?: (tab: "signin" | "register") => void;
  onSuccess?: () => void;
};

export function SignInTab({ onSwitchTab, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      setErrorMessage(null);
      setFieldErrors({});
      toast.success(data.message || "Logged in successfully!");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const msg = formatApiError(error);
      setErrorMessage(msg);
      setFieldErrors(extractFieldErrors(error));
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="flex flex-col p-4 bg-[#053345] font-albert-sans">
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back!</h2>
        <p className="mt-1.5 text-[16px] font-normal text-white">Please enter your details.</p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-200">
          <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-red-400" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
              if (fieldErrors.email) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }
            }}
            placeholder="Email Address"
            required
            disabled={loginMutation.isPending}
            className={cn(
              "h-14 w-full rounded-xl border bg-[#053345] px-4 text-[16px] font-normal text-white placeholder:text-white/40 focus:bg-[#042838]/80 focus:outline-none focus:ring-1 transition-colors disabled:opacity-60",
              fieldErrors.email
                ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/40"
                : "border-[#005F78] focus:border-[#00B8DB] focus:ring-[#00B8DB]/50"
            )}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-400 px-1">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }
              }}
              placeholder="Password"
              required
              disabled={loginMutation.isPending}
              className={cn(
                "h-14 w-full rounded-xl border bg-[#053345] px-4 text-[16px] font-normal text-white placeholder:text-white/40 focus:bg-[#042838]/80 focus:outline-none focus:ring-1 transition-colors disabled:opacity-60",
                fieldErrors.password
                  ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/40"
                  : "border-[#005F78] focus:border-[#00B8DB] focus:ring-[#00B8DB]/50"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-400 px-1">{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex justify-end mt-1">
          <button
            type="button"
            className="text-[16px] font-normal text-white hover:text-[#00B8DB] transition-colors cursor-pointer"
          >
            Forget password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-2 h-14 w-full flex items-center justify-center gap-2 rounded-xl bg-[#00B8DB] border border-[#005F78] text-black text-[18px] font-medium tracking-wide shadow-[0_4px_16px_rgba(0,184,219,0.3)] hover:bg-[#00c9ee] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="relative my-6 flex items-center justify-center space-y-4">
        <div className="w-full border-t border-[#0092B8]/30" />
        <span className="absolute bg-[#053345] px-3 text-[16px] text-white/50 font-normal">
          or continue with
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={loginMutation.isPending}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] border border-[#005F78] font-medium text-black text-sm hover:bg-slate-100 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-60"
        >
          <GoogleIcon className="size-5" />
          <span className="text-[18px] font-medium text-[#000000]">Google</span>
        </button>

        <button
          type="button"
          disabled={loginMutation.isPending}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-[#005F78] bg-[#0A0A0A] font-medium text-white text-sm hover:bg-zinc-900 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-60"
        >
          <AppleIcon className="size-7" />
          <span className="text-[18px] font-medium text-[#FAFAFA]">Apple</span>
        </button>
      </div>

      <div className="mt-7 text-center text-[16px] font-normal text-[#FFFFFF]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitchTab?.("register")}
          className="font-medium text-[#00B8DB] hover:underline cursor-pointer underline"
        >
          Create one
        </button>
      </div>
    </div>
  );
}

