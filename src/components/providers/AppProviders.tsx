"use client"

import type { ReactNode } from "react"
import { Toaster } from "sonner"
import { LanguageProvider } from "@/lib/i18n/LanguageProvider"
import type { Lang } from "@/lib/i18n/dictionary"

export default function AppProviders({
  children,
  initialLang,
}: {
  children: ReactNode
  initialLang: Lang
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#FFFDF7",
            border: "1px solid #C5A55A",
            color: "#800020",
          },
        }}
      />
    </LanguageProvider>
  )
}
