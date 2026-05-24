import * as SelectPrimitive from "@radix-ui/react-select"
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { IconCheck, IconChevronDown } from "@/components/ui/icons"
import { cn } from "@/lib/cn"

import { fieldClassName, menuItemClass, overlayPanelClass } from "./formStyles"

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  error?: boolean
  id?: string
  name?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
  className?: string
  triggerClassName?: string
}

/**
 * Radix Select — flat trigger, panel matches trigger width (Stripe settings pattern).
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  options,
  disabled = false,
  error = false,
  id,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  className,
  triggerClassName,
}: SelectProps): JSX.Element {
  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cn(
          fieldClassName({ error, className: triggerClassName }),
          "inline-flex h-9 items-center justify-between gap-2 text-left text-sm",
          "data-[placeholder]:text-content-tertiary",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <span className="text-content-tertiary">
            <IconChevronDown size={14} />
          </span>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            overlayPanelClass,
            "z-dropdown overflow-hidden",
            className,
          )}
          position="popper"
          sideOffset={4}
          align="start"
        >
          <SelectPrimitive.Viewport className="min-w-[var(--radix-select-trigger-width)] p-1">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

const SelectItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { children: ReactNode }
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(menuItemClass, className)}
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center text-accent">
        <SelectPrimitive.ItemIndicator>
          <IconCheck size={12} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
