"use client"

import * as React from "react"
import { Toaster } from "react-hot-toast"

import { TooltipProvider } from "@/components/ui/tooltip"

type ProvidersProps = {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TooltipProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#053345",
            color: "#FFFFFF",
            border: "1px solid #005F78",
            borderRadius: "0.75rem",
            fontSize: "14px",
          },
          success: {
            iconTheme: {
              primary: "#00B8DB",
              secondary: "#053345",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#053345",
            },
          },
        }}
      />
    </TooltipProvider>
  )
}