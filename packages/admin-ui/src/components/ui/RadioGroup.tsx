import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { cn } from "@/lib/cn"

type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>

export function RadioGroup({ className, ...rest }: RadioGroupProps): ReactNode {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...rest}
    />
  )
}

type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  label: ReactNode
}

export const RadioGroupItem = forwardRef<
  HTMLButtonElement,
  RadioGroupItemProps
>(function RadioGroupItem({ className, label, id, ...rest }, ref) {
  return (
    <label
      htmlFor={id}
      className="inline-flex min-h-11 cursor-pointer items-center gap-3"
    >
      <RadioGroupPrimitive.Item
        ref={ref}
        id={id}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-md",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
          className,
        )}
        {...rest}
      >
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border border-border-default bg-surface-default",
            "transition-[border-color,background-color,transform] duration-150",
            "data-[state=checked]:border-accent",
            "active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <RadioGroupPrimitive.Indicator className="h-2 w-2 rounded-full bg-accent" />
        </span>
      </RadioGroupPrimitive.Item>
      <span className="text-sm text-content-primary">{label}</span>
    </label>
  )
})
