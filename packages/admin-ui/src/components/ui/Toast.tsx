import * as ToastPrimitive from "@radix-ui/react-toast"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

import { IconClose } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import { formIconButtonClass } from "./formStyles"

type ToastVariant = "default" | "success" | "error"

type ToastInput = {
  id?: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

type ToastRecord = ToastInput & {
  id: string
  open: boolean
}

type ToastAction =
  | { type: "ADD"; toast: ToastRecord }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string }

type ToastContextValue = {
  toasts: ToastRecord[]
  toast: (input: ToastInput) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function toastReducer(state: ToastRecord[], action: ToastAction): ToastRecord[] {
  switch (action.type) {
    case "ADD":
      return [action.toast, ...state].slice(0, 5)
    case "DISMISS":
      return state.map((t) =>
        t.id === action.id ? { ...t, open: false } : t,
      )
    case "REMOVE":
      return state.filter((t) => t.id !== action.id)
    default:
      return state
  }
}

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, dispatch] = useReducer(toastReducer, [])

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "DISMISS", id })
  }, [])

  const toast = useCallback(
    (input: ToastInput): string => {
      const id = input.id ?? crypto.randomUUID()
      dispatch({
        type: "ADD",
        toast: {
          ...input,
          id,
          open: true,
          duration: input.duration ?? 4000,
        },
      })
      return id
    },
    [],
  )

  const value = useMemo(
    (): ToastContextValue => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        <ToasterViewport
          toasts={toasts}
          onDismiss={dismiss}
          onRemove={(id) => {
            dispatch({ type: "REMOVE", id })
          }}
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}

const variantClass: Record<ToastVariant, string> = {
  default: "border-border-default bg-surface-raised text-content-primary",
  success: "border-feedback-success-border bg-feedback-success-subtle text-feedback-success-content",
  error: "border-feedback-danger-border bg-feedback-danger-subtle text-feedback-danger-content",
}

function ToasterViewport({
  toasts,
  onDismiss,
  onRemove,
}: {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
  onRemove: (id: string) => void
}): ReactNode {
  return (
    <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-toast flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm">
      {toasts.map((item, index) => (
        <ToastPrimitive.Root
          key={item.id}
          open={item.open}
          duration={item.duration}
          onOpenChange={(open) => {
            if (!open) {
              onDismiss(item.id)
              window.setTimeout(() => {
                onRemove(item.id)
              }, 200)
            }
          }}
          className={cn(
            "group/toast relative flex w-full items-start gap-3 rounded-md border p-4 shadow-md",
            "transition-[transform,opacity] duration-200 ease-out",
            "data-[state=closed]:duration-150 data-[state=open]:duration-200",
            "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
            "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
            variantClass[item.variant ?? "default"],
          )}
          style={{
            transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div className="min-w-0 flex-1">
            <ToastPrimitive.Title className="text-sm font-semibold">
              {item.title}
            </ToastPrimitive.Title>
            {item.description ? (
              <ToastPrimitive.Description className="mt-1 text-sm opacity-90">
                {item.description}
              </ToastPrimitive.Description>
            ) : null}
          </div>
          <ToastPrimitive.Close
            aria-label="Dismiss notification"
            className={cn(formIconButtonClass, "min-h-9 min-w-9 shrink-0")}
            onClick={() => {
              onDismiss(item.id)
            }}
          >
            <IconClose size={14} />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
    </ToastPrimitive.Viewport>
  )
}
