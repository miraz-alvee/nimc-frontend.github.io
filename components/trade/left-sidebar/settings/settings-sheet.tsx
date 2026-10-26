"use client";

import { useState } from "react";
import { Bell, ChevronDown, Check, KeyRound } from "lucide-react";
import { SideSheet, type SheetProps } from "@/components/shared/side-sheet";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
];

function UKFlag({ className = "h-4 w-5.5" }: { className?: string }) {
  return (
    <svg
      className={cn("shrink-0 overflow-hidden rounded shadow-xs", className)}
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <clipPath id="uk-flag-shape">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-flag-shape)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function SettingsSheet(props: SheetProps) {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  return (
    <SideSheet {...props} side="left" title="Settings" headerBorder={true}>
      <div className="flex-1 p-5 space-y-6 font-albert-sans">
        {/* General Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-normal text-white/70">General</h3>

          {/* Language Selector Card */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex w-full items-center justify-between rounded-2xl border border-[#005F78] bg-[#104E64] p-3.5 hover:border-[#0092B8] hover:bg-[#042838] transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <UKFlag className="h-4.5 w-6" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white leading-tight">Language</span>
                  <span className="text-xs text-white/60 leading-tight">{selectedLanguage}</span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "size-5 text-white/80 transition-transform duration-200",
                  isLangDropdownOpen && "rotate-180 text-[#00B8DB]"
                )}
              />
            </button>

            {/* Language Dropdown Menu */}
            {isLangDropdownOpen && (
              <div className="mt-2 w-full overflow-hidden rounded-xl border border-[#0092B8]/40 bg-[#042838] p-1 shadow-lg animate-in fade-in-50 zoom-in-95">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.name);
                      setIsLangDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer",
                      selectedLanguage === lang.name
                        ? "bg-[#00B8DB]/20 text-[#00B8DB] font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.name && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Card */}
         
          <div className="flex items-center justify-between rounded-2xl border border-[#005F78] bg-[#104E64] px-4 text-[16px] font-normal text-white p-3.5 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-white/90" strokeWidth={1.8} />
              <span className="text-sm font-medium text-white">Notification</span>
            </div>

            {/* Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer border border-[#0092B8]/30",
                notificationsEnabled ? "bg-[#0092B8]" : "bg-[#022535]"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-[#021f2d] shadow-sm transition-transform duration-200 ease-in-out",
                  notificationsEnabled ? "translate-x-5.5 bg-[#032331]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-normal text-white/70">Security</h3>

          {/* Password Card matching Image 3 (bell icon + "Password") */}
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(!isPasswordModalOpen)}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#005F78] bg-[#104E64] p-3.5 hover:border-[#0092B8] hover:bg-[#042838] transition-all cursor-pointer text-left"
          >
            <Bell className="size-5 text-white/90" strokeWidth={1.8} />
            <span className="text-sm font-medium text-white">Password</span>
          </button>

          {/* Expandable Change Password Panel */}
          {isPasswordModalOpen && (
            <div className="rounded-2xl border border-[#0092B8]/40 bg-[#042838]/95 p-4 space-y-3.5 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00B8DB]">
                <KeyRound className="size-4" />
                <span>Change Password</span>
              </div>

              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#0092B8]/50 bg-[#021f2d] px-3 text-xs text-white placeholder:text-white/40 focus:border-[#00B8DB] focus:outline-none"
              />

              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#0092B8]/50 bg-[#021f2d] px-3 text-xs text-white placeholder:text-white/40 focus:border-[#00B8DB] focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordSaved(true);
                    setTimeout(() => {
                      setPasswordSaved(false);
                      setIsPasswordModalOpen(false);
                      setCurrentPassword("");
                      setNewPassword("");
                    }, 1200);
                  }}
                  className="rounded-lg bg-[#00B8DB] px-4 py-2 text-xs font-semibold text-black hover:bg-[#00c9ee] transition-all cursor-pointer"
                >
                  {passwordSaved ? "Saved!" : "Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SideSheet>
  );
}
