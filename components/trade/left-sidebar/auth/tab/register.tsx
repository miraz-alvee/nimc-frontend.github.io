"use client";

import { useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRegisterMutation, formatApiError, extractFieldErrors } from "@/apis";
import { cn } from "@/lib/utils";
import { GoogleIcon, AppleIcon } from "../social-icons";

type Props = {
    onSwitchTab?: (tab: "signin" | "register") => void;
    onSuccess?: () => void;
};

export function RegisterTab({ onSwitchTab, onSuccess }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [accepted, setAccepted] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const registerMutation = useRegisterMutation({
        onSuccess: (data) => {
            setErrorMessage(null);
            setFieldErrors({});
            toast.success(data.message || "Account registered successfully!");
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
        setFieldErrors({});

        if (!email.trim() || !password) {
            setErrorMessage("Please enter all required fields.");
            return;
        }

        if (password.length < 8) {
            setErrorMessage("This password is too short. It must contain at least 8 characters.");
            setFieldErrors({ password: "Must contain at least 8 characters" });
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            setFieldErrors({ confirm_password: "Passwords do not match" });
            return;
        }

        if (!accepted) {
            setErrorMessage("Please accept the Terms & Conditions and Privacy Policy.");
            return;
        }

        registerMutation.mutate({
            email: email.trim(),
            password,
            confirm_password: confirmPassword,
            accept_terms: accepted,
        });
    };

    return (
        <div className="flex flex-col p-4 bg-[#053345] font-albert-sans">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome to BOT NAME</h2>
                <p className="mt-1.5 text-[16px] font-normal text-white">
                    Please enter your details to create an account.
                </p>
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
                        disabled={registerMutation.isPending}
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
                            placeholder="Password (min 8 characters)"
                            required
                            disabled={registerMutation.isPending}
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

                <div>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errorMessage) setErrorMessage(null);
                                if (fieldErrors.confirm_password) {
                                    setFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.confirm_password;
                                        return next;
                                    });
                                }
                            }}
                            placeholder="Confirm Password"
                            required
                            disabled={registerMutation.isPending}
                            className={cn(
                                "h-14 w-full rounded-xl border bg-[#053345] px-4 text-[16px] font-normal text-white placeholder:text-white/40 focus:bg-[#042838]/80 focus:outline-none focus:ring-1 transition-colors disabled:opacity-60",
                                fieldErrors.confirm_password
                                    ? "border-red-500/80 focus:border-red-400 focus:ring-red-500/40"
                                    : "border-[#005F78] focus:border-[#00B8DB] focus:ring-[#00B8DB]/50"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                            {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                    </div>
                    {fieldErrors.confirm_password && (
                        <p className="mt-1 text-xs text-red-400 px-1">{fieldErrors.confirm_password}</p>
                    )}
                </div>

                <div className="mt-1 flex items-start gap-2.5">
                    <button
                        type="button"
                        onClick={() => setAccepted(!accepted)}
                        disabled={registerMutation.isPending}
                        className={cn(
                            "mt-0.5 size-4.5 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer",
                            accepted
                                ? "border-[#00B8DB] bg-[#00B8DB]/20 text-[#00E5FF]"
                                : "border-[#0092B8]/70 bg-transparent text-transparent"
                        )}
                        aria-label="Accept terms and conditions"
                    >
                        <Check className="size-3.5 stroke-3" />
                    </button>
                    <span className="text-[14px] font-normal text-white select-none">
                        I accept{" "}
                        <a href="#" className="text-[#00B8DB] hover:underline">
                            Terms &amp; conditions
                        </a>
                        ,{" "}
                        <a href="#" className="text-[#00B8DB] hover:underline">
                            Privacy policy
                        </a>
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="mt-2 h-14 w-full flex items-center justify-center gap-2 rounded-xl bg-[#00B8DB] border border-[#005F78] text-black text-[18px] font-medium tracking-wide shadow-[0_4px_16px_rgba(0,184,219,0.3)] hover:bg-[#00c9ee] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {registerMutation.isPending ? (
                        <>
                            <Loader2 className="size-5 animate-spin" />
                            <span>Registering...</span>
                        </>
                    ) : (
                        <span>Register</span>
                    )}
                </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-[#0092B8]/30" />
                <span className="absolute bg-[#053345] px-3 text-xs text-white/50 font-light">
                    or continue with
                </span>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    disabled={registerMutation.isPending}
                    className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FAFAFA] border border-[#005F78] font-medium text-black text-sm hover:bg-slate-100 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                    <GoogleIcon className="size-5" />
                    <span className="text-[18px] font-medium text-[#000000]">Google</span>
                </button>

                <button
                    type="button"
                    disabled={registerMutation.isPending}
                    className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-[#005F78] bg-[#0A0A0A] font-medium text-white text-sm hover:bg-zinc-900 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                    <AppleIcon className="size-7" />
                    <span className="text-[18px] font-medium text-[#FAFAFA] mt-1">Apple</span>
                </button>
            </div>

            <div className="mt-7 text-center text-[16px] font-normal text-[#FFFFFF]">
                Already have an account?{" "}
                <button
                    type="button"
                    onClick={() => onSwitchTab?.("signin")}
                    className="font-medium text-[#00B8DB] hover:underline cursor-pointer underline">
                    Sign In
                </button>
            </div>
        </div>
    );
}

