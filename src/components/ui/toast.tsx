"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "destructive" | "success"

export interface ToastActionButton {
 label: string
 onClick: () => void
}

interface Toast {
 id: string
 message: string
 variant: ToastVariant
 action?: ToastActionButton
}

interface ToastState {
 toasts: Toast[]
}

type ToastAction =
 | { type: "ADD_TOAST"; toast: Toast }
 | { type: "REMOVE_TOAST"; id: string }

let listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
 switch (action.type) {
  case "ADD_TOAST":
   memoryState = { toasts: [...memoryState.toasts, action.toast] }
   break
  case "REMOVE_TOAST":
   memoryState = {
    toasts: memoryState.toasts.filter((t) => t.id !== action.id),
   }
   break
 }
 listeners.forEach((listener) => listener(memoryState))
}

let count = 0
function genId() {
 count = (count + 1) % Number.MAX_SAFE_INTEGER
 return count.toString()
}

function toast(message: string, variant: ToastVariant = "default", action?: ToastActionButton) {
 const id = genId()
 dispatch({ type: "ADD_TOAST", toast: { id, message, variant, action } })
 setTimeout(() => {
  dispatch({ type: "REMOVE_TOAST", id })
 }, action ? 9000 : 4000)
 return id
}

function useToast() {
 const [state, setState] = React.useState<ToastState>(memoryState)

 React.useEffect(() => {
  listeners.push(setState)
  return () => {
   listeners = listeners.filter((l) => l !== setState)
  }
 }, [])

 return {
  ...state,
  toast,
  dismiss: (id: string) => dispatch({ type: "REMOVE_TOAST", id }),
 }
}

const variantStyles: Record<ToastVariant, string> = {
 default: "border-rule bg-background text-foreground",
 destructive: "border-brick bg-paper-2 text-brick",
 success: "border-rule bg-paper-3 text-foreground",
}

function Toaster() {
 const { toasts, dismiss } = useToast()

 return (
  <div data-toaster className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
   {toasts.map((t) => (
    <div
     key={t.id}
     className={cn(
      "pointer-events-auto flex items-center justify-between gap-2 rounded-md border px-4 py-3 transition-all animate-in slide-in-from-bottom-2",
      variantStyles[t.variant]
     )}
    >
     <p className="flex-1 text-sm">{t.message}</p>
     {t.action && (
      <button
       onClick={() => { t.action?.onClick(); dismiss(t.id) }}
       className="shrink-0 rounded-md bg-paper-3 px-2.5 py-1 text-xs font-semibold text-paper transition-colors hover:bg-paper-3"
      >
       {t.action.label}
      </button>
     )}
     <button
      onClick={() => dismiss(t.id)}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm opacity-60 transition-opacity hover:opacity-100"
     >
      <X className="h-3 w-3" />
     </button>
    </div>
   ))}
  </div>
 )
}

export { toast, useToast, Toaster }
export type { ToastVariant }
